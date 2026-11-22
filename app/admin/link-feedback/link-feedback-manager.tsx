'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatChineseDateTime } from '@/lib/date';

type Feedback = {
  id: string;
  software_title: string;
  provider: string;
  share_url: string;
  reason: string;
  details: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  reviewed: '已查看',
  resolved: '已修复',
  dismissed: '已忽略',
};
const reasonLabels: Record<string, string> = {
  expired: '分享链接已失效',
  not_found: '文件不存在或已删除',
  password_invalid: '提取码错误',
  access_denied: '无法访问或需要权限',
  other: '其他问题',
};

export default function LinkFeedbackManager() {
  const [feedback, setFeedbacks] = useState<Feedback[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/software/link-feedback');
      const body = await response.json().catch(() => ({}));
      if (response.ok) setFeedbacks(body.feedback || []);
      else setError(body.error || '读取反馈失败');
    } catch {
      setError('网络暂时不可用，无法读取反馈。');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function update(feedback: Feedback, status: string, adminNote: string) {
    setBusyId(feedback.id);
    setError('');
    try {
      const response = await fetch('/api/admin/software/link-feedback', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: feedback.id, status, adminNote }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) setError(body.error || '更新失败');
      else await load();
    } catch {
      setError('网络暂时不可用，更新失败。');
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="space-y-3">
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {!feedback.length ? <div className="admin-panel text-sm opacity-70">暂时没有用户反馈。</div> : feedback.map(feedback => (
        <FeedbackCard key={feedback.id} feedback={feedback} busy={busyId === feedback.id} onSave={update} />
      ))}
    </section>
  );
}

function FeedbackCard({ feedback, busy, onSave }: {
  feedback: Feedback;
  busy: boolean;
  onSave: (feedback: Feedback, status: string, note: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(feedback.status);
  const [note, setNote] = useState(feedback.admin_note || '');

  return (
    <article className="admin-panel space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{feedback.software_title} · {feedback.provider}</h2>
          <p className="mt-1 text-xs opacity-60">{reasonLabels[feedback.reason] || feedback.reason} · {formatChineseDateTime(feedback.created_at)}</p>
        </div>
        <span className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: 'var(--border-color)' }}>{statusLabels[feedback.status] || feedback.status}</span>
      </div>
      <a href={feedback.share_url} target="_blank" rel="noopener noreferrer" className="block break-all text-xs underline" style={{ color: 'var(--accent)' }}>{feedback.share_url}</a>
      {feedback.details && <p className="whitespace-pre-wrap text-sm opacity-80">{feedback.details}</p>}
      <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
        <select value={status} onChange={event => setStatus(event.target.value)} className="admin-input">
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input value={note} onChange={event => setNote(event.target.value)} maxLength={500} placeholder="管理员备注（选填）" className="admin-input" />
        <button type="button" disabled={busy} onClick={() => void onSave(feedback, status, note)} className="owenfx-btn owenfx-btn-primary">{busy ? '保存中…' : '保存处理结果'}</button>
      </div>
    </article>
  );
}
