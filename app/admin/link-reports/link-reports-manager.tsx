'use client';

import { useCallback, useEffect, useState } from 'react';

type Report = {
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

export default function LinkReportsManager() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/software/link-reports');
      const body = await response.json().catch(() => ({}));
      if (response.ok) setReports(body.reports || []);
      else setError(body.error || '读取反馈失败');
    } catch {
      setError('网络暂时不可用，无法读取反馈。');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function update(report: Report, status: string, adminNote: string) {
    setBusyId(report.id);
    setError('');
    try {
      const response = await fetch('/api/admin/software/link-reports', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: report.id, status, adminNote }),
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
      {!reports.length ? <div className="admin-panel text-sm opacity-70">暂时没有用户反馈。</div> : reports.map(report => (
        <ReportCard key={report.id} report={report} busy={busyId === report.id} onSave={update} />
      ))}
    </section>
  );
}

function ReportCard({ report, busy, onSave }: {
  report: Report;
  busy: boolean;
  onSave: (report: Report, status: string, note: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState(report.admin_note || '');

  return (
    <article className="admin-panel space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{report.software_title} · {report.provider}</h2>
          <p className="mt-1 text-xs opacity-60">{reasonLabels[report.reason] || report.reason} · {new Date(report.created_at).toLocaleString('zh-CN')}</p>
        </div>
        <span className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: 'var(--border-color)' }}>{statusLabels[report.status] || report.status}</span>
      </div>
      <a href={report.share_url} target="_blank" rel="noopener noreferrer" className="block break-all text-xs underline" style={{ color: 'var(--accent)' }}>{report.share_url}</a>
      {report.details && <p className="whitespace-pre-wrap text-sm opacity-80">{report.details}</p>}
      <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
        <select value={status} onChange={event => setStatus(event.target.value)} className="admin-input">
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input value={note} onChange={event => setNote(event.target.value)} maxLength={500} placeholder="管理员备注（选填）" className="admin-input" />
        <button type="button" disabled={busy} onClick={() => void onSave(report, status, note)} className="uiverse-btn uiverse-btn-primary">{busy ? '保存中…' : '保存处理结果'}</button>
      </div>
    </article>
  );
}
