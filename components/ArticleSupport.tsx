'use client';
import SoftwareSupport from '@/components/SoftwareSupport';
export default function ArticleSupport({ className = '' }: { className?: string }) {
  return <SoftwareSupport placement="article" className={className} />;
}
