import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrackLink from '@/components/TrackLink';
import SoftwareLinkFeedbackButton from '@/components/SoftwareLinkFeedbackButton';
import SoftwareSupport from '@/components/SoftwareSupport';
import ArticleContent from '@/components/ArticleContent';
import { formatChineseDate } from '@/lib/date';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://owenfx-blog.vercel.app';

const categoryColors: Record<string, string> = {
  '工具': '#FF4444',
  '多媒体': '#FF8C00',
  '系统增强': '#3FB950',
  'Android软件': '#3B82F6',
  'Windows软件': '#A855F7',
};

function formatPlatforms(platform: string | null) {
  if (!platform) return [];
  return [...new Set(platform
    .split(/[、，,;；|]+/)
    .map(value => value.trim())
    .filter(Boolean)
    .map(value => value.replace(/\s+\d[\d./+-]*(?:\s*\/\s*\d[\d./+-]*)?$/, '').trim())
    .filter(Boolean))]
    .sort((a, b) => {
      const order: Record<string, number> = {
        Linux: 0,
        macOS: 1,
        Windows: 2,
      };
      return (order[a] ?? Number.MAX_SAFE_INTEGER) - (order[b] ?? Number.MAX_SAFE_INTEGER);
    });
}

// Brand-mark style vector artwork. These are clean, scalable marks rather than app-store tiles.
function ProviderIcon({ provider }: { provider: string }) {
���q�^