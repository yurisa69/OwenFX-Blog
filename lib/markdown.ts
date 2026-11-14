import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
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

        if (first?.type === 'text' && typeof first.value === 'string'
          && middle?.type === 'link' && typeof middle.url === 'string'
          && /^https?:\/\//i.test(middle.url)
          && last?.type === 'text' && typeof last.value === 'string') {
          const prefix = first.value.match(/!\[([^\]]*)\]\($/);
          const suffix = last.value.match(/^\s+=(\d{1,5})x(\d{1,5})\)/);

          if (prefix && suffix) {
            const before = first.value.slice(0, first.value.length - prefix[0].length);
            const after = last.value.slice(suffix[0].length);
            if (before) output.push({ type: 'text', value: before });

            output.push({
              type: 'image',
              url: middle.url,
              alt: prefix[1],
              title: null,
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

function rehypeAddCodeLanguageLabels() {
  return (tree: HtmlNode) => {
    const visit = (node: HtmlNode) => {
      if (node.type === 'element' && node.tagName === 'pre') {
        const code = node.children?.find(child => child.type === 'element' && child.tagName === 'code');
        const classNames = code?.properties?.className;
        if (Array.isArray(classNames)) {
          const languageClass = classNames.find(value =>
            typeof value === 'string' && value.startsWith('language-'),
          );
          if (typeof languageClass === 'string') {
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
    code: [['className', /^language-/, 'hljs']],
    pre: [['dataLanguage', /^[a-zA-Z0-9_+#.-]+$/]],
    span: [['className', /^hljs-/]],
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

const markdownProcessor = remark()
  .use(remarkGfm)
  .use(remarkOwenFxCompatibility)
  .use(remarkRehype)
  .use(rehypeHighlight)
  .use(rehypeAddCodeLanguageLabels)
  .use(rehypeSanitize, markdownSanitizeSchema)
  .use(rehypeStringify);

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
    if (firstHeading?.[1].trim() === options.articleTitle.trim()) {
      lines.splice(firstContentLine, 1);
    }
  }

  return String(markdownProcessor.processSync(lines.join('\n')));
}
