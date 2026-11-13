'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
    all: rows.length,
    pending: rows.filter(row => row.status === 'pending').length,
    approved: rows.filter(row => row.status === 'approved').length,
    rejected: rows.filter(row => row.status === 'rejected').length,
    spam: rows.filter(row => row.status === 'spam').length,
    deleted: rows.filter(row => row.status === 'deleted').length,
  }), [rows]);

  const visibleRows = filter === 'all' ? rows : rows.filter(row => row.status === filter);

  async function runAction(row: CommentRow, action: string) {
    setBusyId(row.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: row.id, action }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || '评论操作失败');
      setNotice(action === 'spam' ? '已移入垃圾评论。'
        : action === 'delete' ? '评论已移入已删除。'
        : '评论已恢复。');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '评论操作失败');
    } finally {
      setBusyId('');
    }
  }

  async function updateStatus(row: CommentRow, status: 'pending' | 'approved' | 'rejected') {
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
      setNotice(status === 'approved' ? '评论已通过并公开显示。'
        : status === 'rejected' ? '评论已拒绝，不会公开显示。'
        : '评论已退回待审核。');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '评论状态更新失败');
    } finally {
      setBusyId('');
    }
  }

  async function permanentlyDelete(row: CommentRow) {
    if (!window.confirm('永久删除这条评论？此操作不可恢复。')) return;
    setBusyId(row.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/comments?id=${encodeURIComponent(row.id)}`, { method: 'DELETE' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || '评论永久删除失败');
      setNotice('评论已永久删除。');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '评论永久删除失败');
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
          const busy = busyId === row.id;
          return <article key={row.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {row.author?.avatar_url ? <img src={row.author.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm" style={{ background: 'var(--bg-tertiary)' }}>{name.slice(0, 1).toUpperCase()}</div>}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="mt-0.5 text-xs opacity-60">{formatChineseDateTime(row.created_at)}</p>
                </div>
              </div>
              <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: row.status === 'pending' || row.status === 'spam' ? 'var(--accent-bg)' : 'var(--bg-tertiary)', color: row.status === 'pending' || row.status === 'spam' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {statusLabels[row.status]}
              </span>
            </div>
            <p className="my-3 whitespace-pre-wrap break-words text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{row.body}</p>
            {row.moderation_reason && <p className="mb-3 text-xs opacity-65">拦截原因：{row.moderation_reason}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
              <p className="min-w-0 truncate text-xs opacity-60">文章：{row.article?.title || '文章已不可用'}</p>
              <div className="flex flex-wrap gap-2">
                {row.status === 'spam' || row.status === 'deleted' ? (
                  <>
                    <button type="button" disabled={busy} className="uiverse-btn uiverse-btn-primary !px-3 !py-1.5 text-xs" onClick={() => void runAction(row, 'restore')}>{busy ? '处理中…' : '恢复'}</button>
                    <button type="button" disabled={busy} className="admin-nav-link !px-3 !py-1.5 text-xs" onClick={() => void permanentlyDelete(row)}>永久删除</button>
                  </>
                ) : (
                  <>
                    {row.status !== 'approved' && <button type="button" disabled={busy} className="uiverse-btn uiverse-btn-primary !px-3 !py-1.5 text-xs" onClick={() => void updateStatus(row, 'approved')}>{busy ? '处理中…' : '通过'}</button>}
                    {row.status !== 'rejected' && <button type="button" disabled={busy} className="admin-nav-link !px-3 !py-1.5 text-xs" onClick={() => void updateStatus(row, 'rejected')}>拒绝</button>}
                    <button type="button" disabled={busy} className="admin-nav-link !px-3 !py-1.5 text-xs" onClick={() => void runAction(row, 'spam')}>标记垃圾</button>
                    <button type="button" disabled={busy} className="admin-nav-link !px-3 !py-1.5 text-xs" onClick={() => void runAction(row, 'delete')}>删除</button>
                    {row.status !== 'pending' && <button type="button" disabled={busy} className="admin-nav-link !px-3 !py-1.5 text-xs" onClick={() => void updateStatus(row, 'pending')}>退回待审核</button>}
                  </>
                )}
              </div>
            </div>
          </article>;
        })}
      </div>}
  </section>;
}
