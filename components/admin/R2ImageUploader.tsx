'use client';

import { useRef, useState } from 'react';

type Props = {
  kind: 'image' | 'software_icon';
  label: string;
  alt: string;
  value: string;
  onChange: (value: string) => void;
};

export default function R2ImageUploader({ kind, label, alt, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(file?: File) {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
      setError('仅支持 JPG、PNG、WebP、GIF 和 AVIF 图片');
      return;
    }
    if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
      setError('图片大小必须在 1B 至 5MB 之间');
      return;
    }

    setUploading(true);
    try {
      const signedResponse = await fetch('/api/r2-upload/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, fileName: file.name, contentType: file.type, size: file.size }),
      });
      const signed = await signedResponse.json();
      if (!signedResponse.ok) throw new Error(signed.error || '无法创建 R2 上传地址');

      const putResponse = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: signed.headers,
        body: file,
      });
      if (!putResponse.ok) throw new Error('R2 上传失败，请检查存储桶 CORS 配置');

      const completeResponse = await fetch('/api/r2-upload/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: signed.key, kind, fileName: file.name, alt }),
      });
      const completed = await completeResponse.json();
      if (!completeResponse.ok || !completed.asset?.public_url) {
        throw new Error(completed.error || 'R2 媒体登记失败');
      }
      onChange(completed.asset.public_url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '图片上传失败');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return <div className="space-y-2 sm:col-span-2">
    <label className="block text-sm font-medium">{label}</label>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
        {value ? <img src={value} alt={alt} className="h-full w-full object-contain" /> : <span className="text-xs opacity-50">暂无图片</span>}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <input type="url" className="w-full rounded-lg border bg-transparent p-2 text-sm" placeholder="也可以直接填写 HTTPS 图片地址" value={value} onChange={event => onChange(event.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={event => { void upload(event.target.files?.[0]); }} />
          <button type="button" disabled={uploading} className="admin-nav-link disabled:opacity-50" onClick={() => inputRef.current?.click()}>{uploading ? '正在上传…' : '上传到 Cloudflare R2'}</button>
          {value && <button type="button" className="admin-nav-link" onClick={() => onChange('')}>移除图片</button>}
          <span className="text-xs opacity-50">JPG / PNG / WebP / GIF / AVIF，最大 5MB</span>
        </div>
      </div>
    </div>
    {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
  </div>;
}
