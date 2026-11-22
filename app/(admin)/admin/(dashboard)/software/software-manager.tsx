'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import R2ImageUploader from '@/components/admin/R2ImageUploader';

type LinkItem = { provider: string; label: string; share_url: string; access_code: string };
type SoftwareRow = { id: string; title: string; slug: string; description: string | null; developer: string | null; version: string | null; platform: string | null; file_size: string | null; image_url: string | null; official_download_url: string | null; introduction_markdown: string | null; screenshots?: string[] | null; status: string; archive_previous_status?: string | null; trash_previous_status?: string | null; deleted_at?: string | null; software_download_links?: LinkItem[] };

const emptyLink = (): LinkItem => ({ provider: '', label: '', share_url: '', access_code: '' });
const providers = [{ value: 'uc', label: 'UC网盘' }, { value: 'quark', label: '夸克网盘' }, { value: 'baidu', label: '百度网盘' }, { value: 'thunder', label: '迅雷网盘' }];
const providerNames: Record<string, string> = { uc: 'UC', quark: '夸克', baidu: '百度', thunder: '迅雷' };

export default function SoftwareManager({ initialCreate = false }: { initialCreate?: boolean }) {
  const [rows, setRows] = useState<SoftwareRow[]>([]);
  const [editId, setEditId] = useState('');
  const [formOpen, setFormOpen] = useState(initialCreate);
  const [form, setForm] = useState({ title: '', slug: '', description: '', developer: '', version: '', fi���q�^