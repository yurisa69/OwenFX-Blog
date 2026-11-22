'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';
import { formatChineseDateLocal } from '@/lib/date';

type CommentAuthor = { display_name?: string | null; avatar_url?: string | null } | null;
type CommentRow = {
  id: string;
  author_id: string;
  body: string;
  status: 'approved' | 'pending' | 'rejected' | 'spam';
  created_at: string;
  parent_comment_id: string | null;
  author?: CommentAuthor | CommentAuthor[] | null;
};
type CurrentUser = { id: string; name: string; avatar: string | null };

function getAuthor(author: CommentRow['author']): CommentAuthor {
  return Array.isArray(author) ? author[0] || null : author || null;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatChineseDateLocal(date)} â€¢ ${hours}:${minutes}`;
}

export default function ArticleComments({ articleId, composerOpen, commentModeRequest, onComposerOpenChange }: { articleId: string; composerOpen: boolean; commentModeRequest: number; onComposerOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [comm¶»§q«^