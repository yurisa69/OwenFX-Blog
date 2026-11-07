'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Revision = {
  id: string;
  title: string;
  excerpt: string;
  github_path: string | null;
  github_sha: string | null;
  content_hash: string | null;
  created_at: string;
};

export default function ArticleHistory({ articleId, revisions }: { articleId: string; revisions: Revision[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  async function restore(revision: Revision) {
    if (!window.confirm(`确定恢复到 ${new Date(revision.created_at).toLocaleString('zh-CN')} 的版本吗？当前正文会保留在 GitHub 历史中。`)) return;
    setBusyId(revision.id);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/revisions/${revision.id}/restore`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '恢复失败');
      setMessage('历史版本已恢复，并创建了新的 GitHub 提交。');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '恢复失败');
    } finally {
      setBusyId('');
    }
  }

  return <div className="admin-panel space-y-4">
    <p className="text-sm opacity-70">历史版本保存在 GitHub Commit 中；Supabase 只保存版本索引，不复制文章正文。</p>
    {message && <p className="text-sm" aria-live="polite">{message}</p>}
    {!revisions.length ? <p className="text-sm opacity-60">暂无历史版本记录。</p> : revisions.map(revision => (
      <div key={revision.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
        <div className="min-w-0">
          <p className="font-medium text-sm">{new Date(revision.created_at).toLocaleString('zh-CN')}</p>
          <p className="text-xs opacity-65">{revision.github_sha ? revision.github_sha.slice(0, 12) : '缺少 GitHub Commit'} · {revision.github_path || '无文件路径'}</p>
          {revision.content_hash && <p className="text-xs opacity-45">SHA-256：{revision.content_hash.slice(0, 16)}…</p>}
        </div>
        <button type="button" disabled={Boolean(busyId) || !revision.github_path || !revision.github_sha}
          className="admin-nav-link" onClick={() => void restore(revision)}>
          {busyId === revision.id ? '恢复中…' : '恢复此版本'}
        </button>
      </div>
    ))}
  </div>;
}
