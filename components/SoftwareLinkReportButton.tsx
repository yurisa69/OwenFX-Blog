'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import TrackLink from '@/components/TrackLink';

const reasons = [
  { value: 'expired', label: '分享链接已失效' },
  { value: 'not_found', label: '文件不存在或已被删除' },
  { value: 'password_invalid', label: '提取码错误' },
  { value: 'access_denied', label: '无法访问或需要权限' },
  { value: 'other', label: '其他问题' },
];

export default function SoftwareLinkReportButton({
  href, targetKey, softwareId, downloadLinkId, className, children,
}: {
  href: string;
  targetKey: string;
  softwareId: string;
  downloadLinkId: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('expired');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loginRequired, setLoginRequired] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setLoginRequired(false);
    try {
      const response = await fetch('/api/software/link-reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ softwareId, downloadLinkId, reason, details }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setLoginRequired(true);
        setMessage('请先登录 OwenFX 账号，再提交失效反馈。');
      } else if (!response.ok) {
        setMessage(result.error || '提交失败，请稍后重试。');
      } else {
        setMessage('反馈已提交，感谢帮助我们维护下载链接。');
        setDetails('');
      }
    } catch {
      setMessage('网络暂时不可用，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <TrackLink href={href} eventType="software_click" targetKey={targetKey}
        softwareId={softwareId} className={className}>{children}</TrackLink>
      <button type="button" onClick={() => { setOpen(true); setMessage(''); }}
        className="text-[10px] opacity-55 transition hover:opacity-100 hover:text-[var(--accent)]">
        反馈失效
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="link-report-title"
            className="w-full max-w-md rounded-2xl border p-5 shadow-2xl"
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="link-report-title" className="font-semibold">反馈网盘链接问题</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭" className="text-xl opacity-60">×</button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <label className="block text-sm">
                问题类型
                <select value={reason} onChange={event => setReason(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border bg-transparent p-2.5"
                  style={{ borderColor: 'var(--border-color)' }}>
                  {reasons.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                补充说明（选填）
                <textarea value={details} onChange={event => setDetails(event.target.value)}
                  maxLength={800} rows={3} placeholder="例如：打开后提示分享已取消"
                  className="mt-1.5 w-full resize-y rounded-lg border bg-transparent p-2.5"
                  style={{ borderColor: 'var(--border-color)' }} />
              </label>
              {message && <p role="status" className="text-sm" style={{ color: loginRequired ? 'var(--text-secondary)' : 'var(--accent)' }}>{message}</p>}
              {loginRequired && <a className="text-sm underline" href={'/auth/login?next=' + encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}>前往登录</a>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: 'var(--border-color)' }}>取消</button>
                <button type="submit" disabled={busy} className="uiverse-btn uiverse-btn-primary">{busy ? '提交中…' : '提交反馈'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
