import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

export type MarkdownOptions = {
  articleTitle?: string;
  removeDownloadLinks?: boolean;
};

type MarkdownNode = {
  type: string;
  value?: string;
  url?: string;
  alt?: string | null;
  title?: string | null;
  children?: MarkdownNode[];
  data?: { hProperties?: Record<string, unknown> };
};

type HtmlNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HtmlNode[];
};

function remarkOwenFxCompatibility() {
  return (tree: MarkdownNode) => {
    const imageProperties = (width?: number, height?: number) => ({
      className: ['article-markdown-image'],
      loading: 'lazy',
      decoding: 'async',
      referrerPolicy: 'no-referrer',
      ...(width && height && width <= 10000 && height <= 10000 ? { width, height } : {}),
    });

    const visit = (node: MarkdownNode) => {
      if (!node.children) return;

      const output: MarkdownNode[] = [];
      let index = 0;

      while (index < node.children.length) {
        const first = node.children[index];
        const middle = node.children[index + 1];
        const last = node.children[index + 2];

        // The legacy renderer preserved source line breaks inside paragraphs.
        // CommonMark represents these as soft line breaks inside text nodes.
        if (first?.type === 'text' && typeof first.value === 'string' && first.value.includes('\n')) {
          const parts = first.value.split('\n');
          for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
            if (parts[partIndex]) output.push({ type: 'text', value: parts[partIndex] });
            if (partIndex < parts.length - 1) output.push({ type: 'break' });
          }
          index += 1;
          continue;
        }

        if (first?.type === 'text' && typeof first.value === 'string'
          && middle?.type === 'link' && typeof middle.url === 'string'
          && /^https?:\/\//i.test(middle.url)
          && last?.type === 'text' && typeof last.value === 'string') {
          const prefix = first.value.match(/!\[([^\]]*)\]\($/);
          const suffix = last.value.match(/^\s+=(\d{1,5})x(\d{1,5})(?:\s+"([^"]*)")?\)/);

          if (prefix && suffix) {
            const before = first.value.slice(0, first.value.length - prefix[0].length);
            const after = last.value.slice(suffix[0].length);
            if (before) output.push({ type: 'text', value: before });

            output.push({
              type: 'image',
              url: middle.url,
              alt: prefix[1],
              title: suffix[3] ?? null,
              data: {
                hProperties: imageProperties(Number(suffix[1]), Number(suffix[2])),
              },
            });

            if (after) output.push({ type: 'text', value: after });
            index += 3;
            continue;
          }
        }

        if (first.type === 'html' && typeof first.value === 'string') {
          output.push({ type: 'text', value: first.value });
          index += 1;
          continue;
        }

        if (first.type === 'image') {
          first.data ??= {};
          first.data.hProperties = {
            ...first.data.hProperties,
            ...imageProperties(),
          };
        }

        if (first.type === 'link' && typeof first.url === 'string' && /^https?:\/\//i.test(first.url)) {
          first.data ??= {};
          first.data.hProperties = {
            ...first.data.hProperties,
            target: '_blank',
            rel: ['noopener', 'noreferrer'],
          };
        }

        visit(first);
        output.push(first);
        index += 1;
      }

      node.children = output;
    };

    visit(tree);
  };
}


function rehypeWrapTables() {
  return (tree: HtmlNode) => {
    const visit = (node: HtmlNode) => {
      if (!node.children) return;
      const output: HtmlNode[] = [];
      for (const child of node.children) {
        if (child.type === 'element' && child.tagName === 'table') {
          output.push({
            type: 'element',
            tagName: 'div',
            properties: { className: ['article-table-wrap'] },
            children: [child],
          });
        } else {
          visit(child);
          output.push(child);
        }
      }
      node.children = output;
    };
    visit(tree);
  };
}

const languageAliases: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  md: 'markdown',
  plaintext: 'text',
  plain: 'text',
  txt: 'text',
};

const supportedLanguages = new Set([
  'bash', 'javascript', 'typescript', 'jsx', 'tsx', 'python', 'html', 'css',
  'json', 'sql', 'yaml', 'markdown', 'java', 'go', 'rust', 'nginx', 'text',
]);

function getClassNames(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  return [];
}

function rehypeNormalizeCodeLanguages() {
  return (tree: HtmlNode) => {
    const visit = (node: HtmlNode) => {
      if (node.type === 'element' && node.tagName === 'pre') {
        const code = node.children?.find(child => child.type === 'element' && child.tagName === 'code');
        if (code?.properties) {
          const classNames = getClassNames(code.properties.className ?? code.properties.class);
          const languageClass = classNames.find(value => value.startsWith('language-'));
          if (languageClass) {
            const originalLanguage = languageClass.slice('language-'.length);
            const normalizedLanguage = languageAliases[originalLanguage.toLowerCase()] ?? originalLanguage.toLowerCase();
            if (supportedLanguages.has(normalizedLanguage)) {
              code.properties.className = classNames.map(value =>
                value === languageClass ? 'language-' + normalizedLanguage : value,
              );
              if (normalizedLanguage !== originalLanguage) {
                node.properties ??= {};
                node.properties.dataLanguage = originalLanguage;
              }
            }
          }
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

function rehypeAddCodeLanguageLabels() {
  return (tree: HtmlNode) => {
    const visit = (node: HtmlNode) => {
      if (node.type === 'element' && node.tagName === 'pre') {
        const code = node.children?.find(child => child.type === 'element' && child.tagName === 'code');
        const classNames = getClassNames(code?.properties?.className ?? code?.properties?.class);
        if (!node.properties?.dataLanguage) {
          const languageClass = classNames.find(value => value.startsWith('language-'));
          if (languageClass) {
            node.properties ??= {};
            node.properties.dataLanguage = languageClass.slice('language-'.length);
          }
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

const markdownSanitizeSchema = {
  ...defaultSchema,
  // remark-rehype already prefixes generated footnote IDs; avoid double-prefixing IDs without their fragment links.
  clobberPrefix: '',
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), 'title', ['target', '_blank'], 'rel'],
    div: [...(defaultSchema.attributes?.div ?? []), ['className', 'article-table-wrap']],
    code: [['className', /^language-/]],
    pre: [['dataLanguage', /^[a-zA-Z0-9_+#.-]+$/]],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      'alt',
      ['className', 'article-markdown-image'],
      'width',
      'height',
      ['loading', 'lazy'],
      ['decoding', 'async'],
      ['referrerPolicy', 'no-referrer'],
      'title',
    ],
  },
} as import('rehype-sanitize').Options;

async function createMarkdownProcessor() {
  const [{ createHighlighter }, { default: rehypeShikiFromHighlighter }] = await Promise.all([
    import('shiki'),
    import('@shikijs/rehype/core'),
  ]);
  const highlighter = await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [...supportedLanguages],
  });

  return remark()
    .use(remarkGfm)
    .use(remarkOwenFxCompatibility)
    .use(remarkRehype)
    .use(rehypeWrapTables)
    // Sanitize untrusted Markdown/HTML before Shiki adds trusted token styles.
    .use(rehypeSanitize, markdownSanitizeSchema)
    .use(rehypeNormalizeCodeLanguages)
    .use(rehypeShikiFromHighlighter, highlighter, {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      addLanguageClass: true,
    })
    .use(rehypeAddCodeLanguageLabels)
    .use(rehypeStringify);
}

let markdownProcessorPromise: ReturnType<typeof createMarkdownProcessor> | null = null;

async function getMarkdownProcessor() {
  if (!markdownProcessorPromise) {
    markdownProcessorPromise = createMarkdownProcessor().catch(error => {
      markdownProcessorPromise = null;
      throw error;
    });
  }
  return markdownProcessorPromise;
}

export async function markdownToHtml(source: string, options: MarkdownOptions = {}) {
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
    if (firstHeading?.[1].trim() === options.articleTitle.trim()) {
      lines.splice(firstContentLine, 1);
    }
  }

  const processor = await getMarkdownProcessor();
  return String(await processor.process(lines.join('\n')));
}
