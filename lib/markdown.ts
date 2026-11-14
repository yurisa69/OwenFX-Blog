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

function highlightCode(source: string, language: string) {
  const lang = language.toLowerCase().replace(/^language-/, '');
  const keywordSets: Record<string, string> = {
    javascript: 'const let var function return if else for while do switch case break continue new class extends import from export default async await try catch throw typeof instanceof in of this true false null undefined',
    js: 'const let var function return if else for while do switch case break continue new class extends import from export default async await try catch throw typeof instanceof in of this true false null undefined',
    typescript: 'const let var function return if else for while do switch case break continue new class extends import from export default async await try catch throw typeof instanceof in of this true false null undefined interface type enum implements public private readonly keyof unknown never any string number boolean void',
    ts: 'const let var function return if else for while do switch case break continue new class extends import from export default async await try catch throw typeof instanceof in of this true false null undefined interface type enum implements public private readonly keyof unknown never any string number boolean void',
    python: 'def class return if elif else for while in import from as try except finally raise with lambda yield async await pass break continue and or not is True False None self',
    py: 'def class return if elif else for while in import from as try except finally raise with lambda yield async await pass break continue and or not is True False None self',
    bash: 'if then else elif fi for while do done case esac function export local readonly return exit echo cd pwd sudo apt npm npx git curl',
    sh: 'if then else elif fi for while do done case esac function export local readonly return exit echo cd pwd sudo apt npm npx git curl',
    json: 'true false null',
    sql: 'select from where insert into values update set delete create table alter drop join left right inner outer on as and or not null is distinct order by group having limit offset primary key foreign references returning',
    css: 'important inherit initial unset none block flex grid inline relative absolute fixed sticky auto hidden',
  };
  const keywords = new Set((keywordSets[lang] || keywordSets.javascript).split(/\s+/));
  const tokenPattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|"(?:(?:\\.)|[^"\\])*"|'(?:(?:\\.)|[^'\\])*'|\x60(?:(?:\\.)|[^\x60\\])*\x60|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b|===?|!==?|=>|\+\+|--|&&|\|\||\?\?|\*\*|[{}()[\].,;:+%!?=<>\/-])/g;
  let result = '';
  let lastIndex = 0;
  for (const match of source.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    result += escapeHtml(source.slice(lastIndex, index));
    const token = match[0];
    let tokenClass = '';
    if (/^(\/\/|\/\*|#)/.test(token)) tokenClass = 'comment';
    else if (/^["'\x60]/.test(token)) tokenClass = 'string';
    else if (/^\d/.test(token)) tokenClass = 'number';
    else if (keywords.has(token)) tokenClass = 'keyword';
    else if (/^[A-Za-z_$][\w$]*$/.test(token) && /\s*\(/.test(source.slice(index + token.length, index + token.length + 4))) tokenClass = 'function';
    else if (/^(===?|!==?|=>|\+\+|--|&&|\|\||\?\?|\*\*)$/.test(token)) tokenClass = 'operator';
    const safeToken = escapeHtml(token);
    result += tokenClass ? '<span class="code-token-' + tokenClass + '">' + safeToken + '</span>' : safeToken;
    lastIndex = index + token.length;
  }
  return result + escapeHtml(source.slice(lastIndex));
}
function renderInline(value: string): string {
  const pattern = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+"([^"]*)")?\)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)(?:\s+"([^"]*)")?\)|\x60([^\x60]+)\x60|\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g;
  let result = '';
  let lastIndex = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    result += escapeHtml(value.slice(lastIndex, index));
    if (match[1] !== undefined) {
      const url = safeHttpUrl(match[2]);
      result += url
        ? '<img class="article-markdown-image" src="' + escapeHtml(url) + '" alt="' + escapeHtml(match[1]) + '" title="' + escapeHtml(match[3] || '') + '" width="1200" height="675" loading="lazy" decoding="async" referrerpolicy="no-referrer" />'
        : escapeHtml(match[0]);
    } else if (match[4] !== undefined) {
      const url = safeHttpUrl(match[5]);
      result += url
        ? '<a href="' + escapeHtml(url) + '" title="' + escapeHtml(match[6] || '') + '" target="_blank" rel="noopener noreferrer">' + renderInline(match[4]) + '</a>'
        : escapeHtml(match[0]);
    } else if (match[7] !== undefined) result += '<code>' + escapeHtml(match[7]) + '</code>';
    else if (match[8] !== undefined) result += '<strong>' + renderInline(match[8]) + '</strong>';
    else if (match[9] !== undefined) result += '<strong>' + renderInline(match[9]) + '</strong>';
    else if (match[10] !== undefined) result += '<del>' + renderInline(match[10]) + '</del>';
    else if (match[11] !== undefined) result += '<em>' + renderInline(match[11]) + '</em>';
    else if (match[12] !== undefined) result += '<em>' + renderInline(match[12]) + '</em>';
    lastIndex = index + match[0].length;
  }
  const remainder = value.slice(lastIndex);
  const safeRemainder = escapeHtml(remainder).replace(/(https?:\/\/[^\s<]+)/g, url => {
    const clean = url.replace(/[),.!?]+$/, '');
    const suffix = url.slice(clean.length);
    return '<a href="' + clean + '" target="_blank" rel="noopener noreferrer">' + clean + '</a>' + suffix;
  });
  return result + safeRemainder;
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
    } else cell += char;
    escaped = char === '\\' && !escaped;
    if (char !== '\\') escaped = false;
  }
  cells.push(cell.trim());
  return cells;
}

function tableAlignment(line: string) {
  return splitTableRow(line).map(cell => {
    const value = cell.trim();
    if (value.startsWith(':') && value.endsWith(':')) return 'center';
    if (value.endsWith(':')) return 'right';
    return 'left';
  });
}

function isTableDivider(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function listMarker(line: string) {
  const match = line.match(/^(\s*)([-+*]|\d+[.)])\s+(.*)$/);
  if (!match) return null;
  return {
    indent: match[1].replace(/\t/g, '  ').length,
    ordered: /^\d/.test(match[2]),
    marker: match[2],
    content: match[3],
  };
}

function parseList(lines: string[], start: number, indent: number, ordered: boolean): [string, number] {
  const items: string[] = [];
  let index = start;
  while (index < lines.length) {
    const marker = listMarker(lines[index]);
    if (!marker || marker.indent !== indent || marker.ordered !== ordered) break;
    let content = marker.content;
    const task = content.match(/^\[([ xX])\]\s+(.*)$/);
    let rendered = renderInline(task ? task[2] : content);
    if (task) rendered = '<input type="checkbox" disabled ' + (task[1].toLowerCase() === 'x' ? 'checked ' : '') + '/> ' + rendered;
    index += 1;

    while (index < lines.length) {
      const next = lines[index];
      const nextMarker = listMarker(next);
      if (nextMarker && nextMarker.indent === indent) break;
      if (nextMarker && nextMarker.indent > indent) {
        const [nested, nextIndex] = parseList(lines, index, nextMarker.indent, nextMarker.ordered);
        rendered += nested;
        index = nextIndex;
        continue;
      }
      if (!next.trim()) {
        let lookahead = index + 1;
        while (lookahead < lines.length && !lines[lookahead].trim()) lookahead += 1;
        const following = lookahead < lines.length ? listMarker(lines[lookahead]) : null;
        if (following && following.indent >= indent) {
          index = lookahead;
          if (following.indent === indent) break;
          continue;
        }
        index = lookahead;
        break;
      }
      const leading = (next.match(/^\s*/) || [''])[0].replace(/\t/g, '  ').length;
      if (leading > indent) {
        rendered += '<br>' + renderInline(next.trim());
        index += 1;
        continue;
      }
      break;
    }
    items.push('<li' + (task ? ' class="task-list-item"' : '') + '>' + rendered + '</li>');
  }
  const tag = ordered ? 'ol' : 'ul';
  return ['<' + tag + (items.some(item => item.includes('task-list-item')) ? ' class="contains-task-list"' : '') + '>' + items.join('') + '</' + tag + '>', index];
}

function parseBlocks(lines: string[]): string {
  const output: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    const fence = line.match(/^\s*(`{3,}|~{3,})\s*([a-zA-Z0-9_+#.-]*)[^\r\n]*$/);
    if (fence) {
      const code: string[] = [];
      const fenceChar = fence[1][0];
      const fenceLength = fence[1].length;
      const language = fence[2] || '';
      index += 1;
      const close = new RegExp('^\\s*' + (fenceChar === '`' ? '`' : '~') + '{' + fenceLength + ',}\\s*$');
      while (index < lines.length && !close.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const codeHtml = language ? highlightCode(code.join('\n'), language) : escapeHtml(code.join('\n'));
      const langClass = language ? ' class="language-' + escapeHtml(language) + '"' : '';
      output.push('<pre><code' + langClass + '>' + codeHtml + '</code></pre>');
      continue;
    }

    const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      output.push('<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>');
      index += 1;
      continue;
    }

    if (index + 1 < lines.length && /^ {0,3}(?:=+|-+)\s*$/.test(lines[index + 1]) && line.trim()) {
      const level = lines[index + 1].trim().startsWith('=') ? 1 : 2;
      output.push('<h' + level + '>' + renderInline(line.trim()) + '</h' + level + '>');
      index += 2;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      output.push('<hr>');
      index += 1;
      continue;
    }

    if (line.includes('|') && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const header = splitTableRow(line);
      const alignments = tableAlignment(lines[index + 1]);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      const head = header.map((cell, cellIndex) => '<th style="text-align:' + (alignments[cellIndex] || 'left') + '">' + renderInline(cell) + '</th>').join('');
      const body = rows.map(row => '<tr>' + header.map((_, cellIndex) =>
        '<td style="text-align:' + (alignments[cellIndex] || 'left') + '">' + renderInline(row[cellIndex] || '') + '</td>'
      ).join('') + '</tr>').join('');
      output.push('<div class="article-table-wrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>');
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      output.push('<blockquote>' + parseBlocks(quote) + '</blockquote>');
      continue;
    }

    const marker = listMarker(line);
    if (marker) {
      const [list, nextIndex] = parseList(lines, index, marker.indent, marker.ordered);
      output.push(list);
      index = nextIndex;
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      const current = lines[index];
      if (/^( {0,3}#{1,6})\s+/.test(current) || /^\s*>/.test(current) || listMarker(current) ||
          /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(current) ||
          /^\s*(?:`{3,}|~{3,})/.test(current) ||
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
  let cleanedSource = source.replace(/\r\n?/g, '\n');
  if (options.removeDownloadLinks) {
    cleanedSource = cleanedSource
      .replace(/^\s*\*{0,2}\s*(?:官方下载|下载)[^\n]*https?:\/\/\S+[^\n]*$/gim, '')
      .replace(/^\s*\[(?:官方下载|下载)\]\(https?:\/\/[^)\s]+\)\s*$/gim, '');
  }
  const lines = cleanedSource.split('\n');
  const firstContentLine = lines.findIndex(line => line.trim().length > 0);
  if (firstContentLine >= 0 && options.articleTitle) {
    const firstHeading = lines[firstContentLine].match(/^#\s+(.+)$/);
    if (firstHeading?.[1].trim() === options.articleTitle.trim()) lines.splice(firstContentLine, 1);
  }
  return parseBlocks(lines);
}
