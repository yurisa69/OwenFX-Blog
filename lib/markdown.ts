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
          && middle?.type === 'link'¶»§q«^