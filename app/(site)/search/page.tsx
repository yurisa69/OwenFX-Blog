import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { readMarkdownFile } from '@/lib/github-articles';

export const metadata: Metadata = {
  title: '全站搜索 — OwenFX',
  description: '搜索 OwenFX 的文章、软件和标签。',
};

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  github_path: string | null;
  content_markdown: string | null;
  published_at: string | null;
  created_at: string;
};

type SoftwareRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  developer: string | null;
  version: string | null;
  platform: string | null;
  image_url: string | null;
  category: { name: string; slug: string } | { name: string; slug: string }[] | null;
  tags: { tag: { name: string; slug: string } | { name: string; slug: string }[] | null }[] | null;
};

type TagRow = { id: string; name: string; slug: string };

function includesQuery(value: string | null | undefined, query: string) {
  return Boolean(value && value.toLocaleLowerCase().includes(query));
}

async function fetchAllRows<T>(
  loadPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 500;
  for (let offset = 0; offset < 100000; offset += pageSize) {
    const { data, error } = await loadPage(offset, offset ���q�^