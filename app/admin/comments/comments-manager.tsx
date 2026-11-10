'use client';

import Avatar from '@/components/Avatar';
import { useCallback, useEffect, useMemo, useState } from 'react';

type CommentRow = {
  id: string;
  article_id: string;
  author_id: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  author?: { display_name?: string | null; avatar_url?: string | null } | null;
  article?: { title?: string | null; slug?: string | null } | null;
};

const tabs = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
] as const;

export default function CommentsManager() {
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [filter, setFilter] = useState<(typeof tabs)[number]['value']>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/comments', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || '评论列表读取失败');
      setRows(body.comments || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '评论列表读取失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({
    pending: rows.filter(row => row.status === 'pending').length,
    approved: rows.filter(row => row.status === 'approved').length,
    rejected: rows.filter(row => row.status === 'rejected').length,
  }), [rows]);

  const visibleRows = rows.filter(row => row.status === filter);

  async function updateStatus(row: CommentRow, status: CommentRow['status']) {
    setBusyId(row.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: row.id, status }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || '评论状态更新失败');
      setRows(current => current.map(item => item.id === row.id ? { ...item, status } : item));
      setNotice(status === 'approved' ? '评论已通过并公开显示。' : status === 'rejected' ? '评论已拒绝，不会公开显示。' : '评论已退回待审核。');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '评论状态更新失败');
    } finally {
      setBusyId('');
    }
  }

  return <section className="admin-panel space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="评论状态">
        {tabs.map(tab => <button key={tab.value} type="button" role="tab" aria-selected={filter === tab.value}
          onClick={() => setFilter(tab.value)}
          className="rounded-lg border px-3 py-2 text-sm transition"
          style={{ borderColor: filter === tab.value ? 'var(--accent)' : 'var(--border-color)', background: filter === tab.value ? 'var(--accent-bg)' : 'transparent', color: filter === tab.value ? 'var(--accent)' : 'var(--text-secondary)' }}>
          {tab.label}<span className="ml-2 text-xs opacity-70">{counts[tab.value]}</span>
        </button>)}
      </div>
      <button type="button" className="admin-nav-link" onClick={() => void load()} disabled={loading}>刷新</button>
    </div>

    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    {notice && <p role="status" className="text-sm" style={{ color: 'var(--accent)' }}>{notice}</p>}

    {loading ? <p className="py-8 text-center text-sm opacity-60">正在读取评论…</p>
      : visibleRows.length === 0 ? <p className="py-10 text-center text-sm opacity-60">{filter === 'pending' ? '目前没有待审核评论。' : '此分类暂无评论。'}</p>
      : <div className="space-y-3">
        {visibleRows.map(row => {
          const name = row.author?.display_name || '用户';
          return <article key={row.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full text-sm" style={{ background: 'var(--bg-tertiary)' }}><Avatar src={row.author?.avatar_url} alt="" fallback={name.slice(0, 1).toUpperCase()} /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="mt-0.5 text-xs opacity-60">{new Date(row.created_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: row.status === 'pending' ? 'var(--accent-bg)' : 'var(--bg-tertiary)', color: row.status === 'pending' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {row.status === 'pending' ? '待审核' : row.status === 'approved' ? '已通过' : '已拒绝'}
              </span>
            </div>
            <p className="my-3 whitespace-pre-wrap break-words text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{row.body}</p>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
              <p className="min-w-0 truncate text-xs opacity-60">文章：{row.article?.title || '文章已不可用'}</p>
              <div className="flex flex-wrap gap-2">
                {row.status !== 'approved' && <button type="button" disabled={busyId === row.id} className="uiverse-btn uiverse-btn-primary !px-3 !py-1.5 text-xs" onClick={() => void updateStatus(row, 'approved')}>{busyId === row.id ? '处理中…' : '通过'}</button>}
                {row.status !== 'rejected' && <button type="button" disabled={busyId === row.id} className="admin-nav-link !px-3 !py-1.5 text-xs" onClick={() => void updateStatus(row, 'rejected')}>拒绝</button>}
                {row.status !== 'pending' && <button type="button" disabled={busyId === row.id} className="admin-nav-link !px-3 !py-1.5 text-xs" onClick={() => void updateStatus(row, 'pending')}>退回待审核</button>}
              </div>
            </div>
          </article>;
        })}
      </div>}
  </section>;
}
