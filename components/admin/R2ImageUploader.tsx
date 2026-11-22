'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

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
      const signedResponse = await fetch('/api/admin/r2-upload/presign', {
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
      if (!putResponse.ok) throw new ���q�^