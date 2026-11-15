'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Status = 'draft' | 'published' | 'archived' | 'trashed';

export default function ArticleManagementActions({
  articleId,
  status,
}: {
  articleId: string;
  status: Status;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function run(action: string, method: 'POST' | 'DELETE' = 'POST') {
    if (busy) return;
    if (action === 'permanent_delete' && !window.confirm('确定永久删除这篇文章吗？文章记录、评论、标签关联、互动记录和历史版本将一并删除，无法恢复。GitHub 历史提交会保留。')) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/articles/' + articleId, {
        method,
        headers: method === 'POST' ? { 'content-type': 'application/json' } : undefined,
        body: method === 'POST' ? JSON.stringify({ action }) : undefined,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || '操作失败，请稍后重试。');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  const buttonClass = 'admin-nav-link disabled:cursor-not-allowed disabled:opacity-50';
  const deleteClass = buttonClass + ' !text-red-500';
  const archiveClass = buttonClass + ' !text-amber-400';
  const editClass = buttonClass + ' !text-rose-400';
  const restoreClass = buttonClass + ' !text-green-500';

  return (
    <div className="flex flex-wrap items-center justify-start gap-2">
      {status === 'draft' || status === 'published' ? (
        <>
          <button type="button" className={deleteClass} disabled={busy} onClick={() => void run('trash', 'DELETE')}>删除</button>
          <button type="button" className={archiveClass} disabled={busy} onClick={() => void run('archive')}>归档</button>
          <Link className={editClass} href={'/admin/articles/' + articleId}>
            编辑
          </Link>
        </>
      ) : status === 'archived' ? (
        <>
          <button type="button" className={deleteClass} disabled={busy} onClick={() => void run('trash', 'DELETE')}>删除</button>
          <button type="button" className={restoreClass} disabled={busy} onClick={() => void run('restore_archive')}>恢复归档</button>
          <Link className={editClass} href={'/admin/articles/' + articleId}>
            编辑
          </Link>
        </>
      ) : (
        <>
          <button type="button" className={restoreClass} disabled={busy} onClick={() => void run('restore_trash')}>恢复</button>
          <button type="button" className={deleteClass} disabled={busy} onClick={() => void run('permanent_delete')}>永久删除</button>
        </>
      )}
      {busy && <span className="text-xs opacity-60">处理中…</span>}
      {message && <span role="status" className="basis-full text-left text-xs" style={{ color: 'var(--danger)' }}>{message}</span>}
    </div>
  );
}
