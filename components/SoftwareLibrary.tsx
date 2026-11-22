'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type SoftwareTag = {
  id: string;
  name: string;
  slug: string;
};

type SoftwareItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  developer: string | null;
  version: string | null;
  platform: string | null;
  image_url: string | null;
  category: { name: string; slug: string } | null;
  tags: { tag: SoftwareTag | SoftwareTag[] | null }[] | null;
};

function getTagDisplayName(name: string) {
  return name === '免费开源' ? '开源免费' : name;
}

function getSoftwareTagNames(item: SoftwareItem) {
  return (item.tags || [])
    .map((entry) => Array.isArray(entry.tag) ? entry.tag[0]?.name : entry.tag?.name)
    .filter((tag): tag is string => Boolean(tag));
}

export default function SoftwareLibrary({
  items,
  tags,
  initialCategory = '全部',
}: {
  items: SoftwareItem[];
  tags: SoftwareTag[];
  initialCategory?: string;
}) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [displayTags, setDisplayTags] = useState(tags);

  useEffect(() => {
    const shuffled = [...tags];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    setDisplayTags(shuffled);
  }, [tags]);

  const filteredItems = us���q�^