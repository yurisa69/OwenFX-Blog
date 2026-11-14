import hljs from 'highlight.js/lib/common';

export type MarkdownOptions = {
  articleTitle?: string;
  removeDownloadLinks?: boolean;
};

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function renderInline(value: string, escapedCharacters: string[] = [], restoreEscapes = true): string {
  const protectedValue = value.replace(/\\([^\w\s])/g, (_, character: string) => {
    const token = 'OWENFXESC' + escapedCharacters.length + 'TOKEN';
    escapedCharacters.push(character);
    return token;
  });
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+=(\d{1,5})x(\d{1,5}))?\)|\[([^\]]+)\]\(([^)\s]+)\)|\x60([^\x60]+)\x60|\*\*(.+?)\*\*|~~(.+?)~~|(?<!\*)\*([^*]+)\*(?!\*)/g;
  let result = '';
  let lastIndex = 0;

  for (const match of protectedValue.matchAll(pattern)) {
    const index = match.index ?? 0;
    result += escapeHtml(protectedValue.slice(lastIndex, index));

    if (match[1] !== undefined) {
      const url = safeHttpUrl(match[2]);
      const width = Number(match[3]);
      const height = Number(match[4]);
      const dimensions = width > 0 && height > 0 && width <= 10000 && height <= 10000
        ? ' width="' + width + '" height="' + height + '"'
        : '';
      result += url
        ? '<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(match[1]) + '"' + dimensions + ' loading="lazy" decoding="async" referrerpolicy="no-referrer" />'
        : escapeHtml(match[0]);
    } else if (match[5] !== undefined) {
      const url = safeHttpUrl(match[6]);
      result += url
        ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + renderInline(match[5], escapedCharacters, false) + '</a>'
        : escapeHtml(match[0]);
    } else if (match[7] !== undefined) {
      result += '<code>' + escapeHtml(match[7]) + '</code>';
    } else if (match[8] !== undefined) {
      result += '<strong>' + renderInline(match[8], escapedCharacters, false) + '</strong>';
    } else if (match[9] !== undefined) {
      result += '<del>' + renderInline(match[9], escapedCharacters, false) + '</del>';
    } else if (match[10] !== undefined) {
      result += '<em>' + renderInline(match[10], escapedCharacters, false) + '</em>';
    }

    lastIndex = index + match[0].length;
  }

  const remaining = result + escapeHtml(protectedValue.slice(lastIndex));
  return restoreEscapes ? remaining.replace(/OWENFXESC(\d+)TOKEN/g, (_, index: string) => escapeHtml(escapedCharacters[Number(index)] || '')) : remaining;
}

function splitTableRow(line: string) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let cell = '';
  let escaped = false;

  for (const char of trimmed) {
    if (char === '|' && !escaped) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
    escaped = char === '\\' && !escaped;
    if (char !== '\\') escaped = false;
  }

  cells.push(cell.trim());
  return cells;
}

function isTableDivider(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
}

function listMarker(line: string) {
  const match = line.match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
  if (!match) return null;
  return {
    indent: match[1].replace(/\t/g, '  ').length,
    ordered: /^\d/.test(match[2]),
    content: match[3],
  };
}

function parseList(lines: string[], start: number, indent: number, ordered: boolean): [string, number] {
  const items: string[] = [];
  let index = start;
  let containsTask = false;

  while (index < lines.length) {
    const marker = listMarker(lines[index]);
    if (!marker || marker.indent !== indent || marker.ordered !== ordered) break;

    const task = marker.content.match(/^\[([ xX])\]\s+(.*)$/);
    if (task) containsTask = true;
    let content = task
      ? '<input type="checkbox" disabled' + (task[1].toLowerCase() === 'x' ? ' checked' : '') + ' aria-label="任务状态" /> ' + renderInline(task[2])
      : renderInline(marker.content);
    index += 1;

    while (index < lines.length) {
      const next = lines[index];
      const nextMarker = listMarker(next);
      if (nextMarker && nextMarker.indent === indent) break;
      if (nextMarker && nextMarker.indent > indent) {
        const nested = parseList(lines, index, nextMarker.indent, nextMarker.ordered);
        content += nested[0];
        index = nested[1];
        continue;
      }
      if (!next.trim()) {
        let lookahead = index + 1;
        while (lookahead < lines.length && !lines[lookahead].trim()) lookahead += 1;
        const following = lookahead < lines.length ? listMarker(lines[lookahead]) : null;
        if (following && following.indent >= indent) {
          index = lookahead;
          continue;
        }
        index = lookahead;
        break;
      }
      const leading = (next.match(/^\s*/) || [''])[0].replace(/\t/g, '  ').length;
      if (leading > indent) {
        content += '<br>' + renderInline(next.trim());
        index += 1;
        continue;
      }
      break;
    }

    items.push('<li' + (task ? ' class="task-list-item"' : '') + '>' + content + '</li>');
  }

  const tag = ordered ? 'ol' : 'ul';
  const classes = containsTask ? ' class="contains-task-list"' : '';
  return ['<' + tag + classes + '>' + items.join('') + '</' + tag + '>', index];
}

function renderCodeBlock(code: string, language: string) {
  const safeLanguage = language.toLowerCase();
  if (safeLanguage && hljs.getLanguage(safeLanguage)) {
    try {
      const highlighted = hljs.highlight(code, { language: safeLanguage, ignoreIllegals: true }).value;
      return '<pre data-language="' + escapeHtml(safeLanguage) + '"><code class="hljs language-' + escapeHtml(safeLanguage) + '">' + highlighted + '</code></pre>';
    } catch {
      // Fall through to escaped plain text for unknown or malformed language input.
    }
  }
  const languageAttribute = safeLanguage ? ' data-language="' + escapeHtml(safeLanguage) + '"' : '';
  const classAttribute = safeLanguage ? ' class="language-' + escapeHtml(safeLanguage) + '"' : '';
  return '<pre' + languageAttribute + '><code' + classAttribute + '>' + escapeHtml(code) + '</code></pre>';
}

function parseBlocks(lines: string[]): string {
  const output: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^\s*(\x60{3,}|~{3,})\s*([a-zA-Z0-9_+#.-]*)\s*$/);
    if (fence) {
      const code: string[] = [];
      const fenceChar = fence[1][0];
      const fenceLength = fence[1].length;
      const closing = new RegExp('^\\s*' + (fenceChar === '\x60' ? '\x60' : '~') + '{' + fenceLength + ',}\\s*$');
      index += 1;
      while (index < lines.length && !closing.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      output.push(renderCodeBlock(code.join('\n'), fence[2] || ''));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      output.push('<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>');
      index += 1;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      output.push('<hr>');
      index += 1;
      continue;
    }

    if (line.includes('|') && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const header = splitTableRow(line);
      const divider = splitTableRow(lines[index + 1]);
      const alignments = header.map((_, cellIndex) => {
        const cell = divider[cellIndex] || '';
        return cell.startsWith(':') && cell.endsWith(':') ? 'center'
          : cell.endsWith(':') ? 'right' : 'left';
      });
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      const head = header.map((cell, cellIndex) =>
        '<th style="text-align:' + alignments[cellIndex] + '">' + renderInline(cell) + '</th>'
      ).join('');
      const body = rows.map(row => '<tr>' + header.map((_, cellIndex) =>
        '<td style="text-align:' + alignments[cellIndex] + '">' + renderInline(row[cellIndex] || '') + '</td>'
      ).join('') + '</tr>').join('');
      output.push('<div class="article-table-wrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>');
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length) {
        const current = lines[index].match(/^\s*>\s?(.*)$/);
        if (!current) break;
        quoteLines.push(current[1]);
        index += 1;
      }
      output.push('<blockquote>' + parseBlocks(quoteLines) + '</blockquote>');
      continue;
    }

    const marker = listMarker(line);
    if (marker) {
      const list = parseList(lines, index, marker.indent, marker.ordered);
      output.push(list[0]);
      index = list[1];
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      const current = lines[index];
      if (/^(#{1,6})\s+/.test(current) || /^\s*>/.test(current) || listMarker(current) ||
          /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(current) ||
          /^\s*[\x60~]{3,}/.test(current) ||
          (current.includes('|') && index + 1 < lines.length && isTableDivider(lines[index + 1]))) break;
      paragraph.push(renderInline(current));
      index += 1;
    }
    if (paragraph.length) output.push('<p>' + paragraph.join('<br>') + '</p>');
    else index += 1;
  }

  return output.join('');
}

export function markdownToHtml(source: string, options: MarkdownOptions = {}) {
  let cleanedSource = source;
  if (options.removeDownloadLinks) {
    cleanedSource = cleanedSource
      .replace(/^\s*\*{0,2}\s*(?:官方下载|下载)[^\r\n]*https?:\/\/\S+[^\r\n]*$/gim, '')
      .replace(/^\s*\[(?:官方下载|下载)\]\(https?:\/\/[^)\s]+\)\s*$/gim, '');
  }

  const lines = cleanedSource.replace(/\r\n/g, '\n').split('\n');
  const firstContentLine = lines.findIndex(line => line.trim().length > 0);
  if (firstContentLine >= 0 && options.articleTitle) {
    const firstHeading = lines[firstContentLine].match(/^#\s+(.+)$/);
    if (firstHeading?.[1].trim() === options.articleTitle.trim()) lines.splice(firstContentLine, 1);
  }
  return parseBlocks(lines);
}
