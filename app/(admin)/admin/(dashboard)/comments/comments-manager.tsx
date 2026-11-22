'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { formatChineseDateTime } from '@/lib/date';

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam' | 'deleted';
type CommentRow = {
  id: string;
  article_id: string;
  author_id: string;
  body: string;
  status: CommentStatus;
  created_at: string;
  moderation_source?: string | null;
  moderation_reason?: string | null;
  moderation_previous_status?: string | null;
  deleted_at?: string | null;
  author?: { display_name?: string | null; avatar_url?: string | null } | null;
  article?: { title?: string | null; slug?: string | null } | null;
};

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'spam', label: '垃圾评论' },
  { value: 'deleted', label: '已删除' },
] as const;

const statusLabels: Record<CommentStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  spam: '垃圾评论',
  deleted: '已删除',
};

export default function CommentsManager() {
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [filter, setFilter] = useState<(typeof tabs)[number]['value']>('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useS���q�^