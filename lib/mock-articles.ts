export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  featured: boolean;
}

export const mockArticles: Article[] = [
  {
    id: 'a1',
    title: '2026 必备：Windows 效率工具推荐',
    description: '十大开源利器，提升你的 Windows 工作效率。',
    content: '## 概述\nWindows 拥有众多优秀的免费工具。',
    category: '工具评测',
    tags: ['Windows', '效率', '开源'],
    author: 'OwenFX',
    createdAt: '2026-06-25',
    featured: true,
  },
  {
    id: 'a2',
    title: '开源软件指南：从入门到精通',
    description: '教你正确选择和使用开源软件。',
    content: '## 为什么选择开源？\n免费、透明、社区驱动。',
    category: '教程',
    tags: ['开源', '指南', '入门'],
    author: 'OwenFX',
    createdAt: '2026-06-22',
    featured: false,
  },
  {
    id: 'a3',
    title: '系统优化：完全指南',
    description: '从启动优化到磁盘清理的完整指南。',
    content: '## 启动优化\n减少开机自启程序。',
    category: '系统技巧',
    tags: ['Windows', '优化', '指南'],
    author: 'OwenFX',
    createdAt: '2026-06-18',
    featured: false,
  },
];

export const getArticle = (id: string) => mockArticles.find((a) => a.id === id);
