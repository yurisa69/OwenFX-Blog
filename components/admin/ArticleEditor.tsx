'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { markdownToHtml } from '@/lib/markdown';
import { htmlToMarkdown } from '@/lib/article-editor-conversion';

type Draft = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content_markdown?: string;
  status?: string;
  github_blob_sha?: string | null;
};

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}



export default function ArticleEditor({ initial = {} }: { initial?: Draft }) {
  const router = useRouter();
  const richRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'markdown' | 'rich'>('markdown');
  const [title, setTitle] = useState(initial.title || '');
  const [slug, setSlug] = useState(initial.slug || '');
  const [excerpt, setExcerpt] = useState(initial.excerpt || '');
  const [content, setContent] = useState(initial.content_markdown || '');
  const [status, setStatus] = useState(initial.status === 'published' ? 'published' : 'draft');
  const [githubBlobSha, setGithubBlobSha] = useState(initial.github_blob_sha || '');
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(false);

  // ‰∏çÂ∞Ü contmÆÈ‹j◊ù