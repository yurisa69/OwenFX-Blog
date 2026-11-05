export type Article = {
  id: string
  title: string
  excerpt: string
  content?: string
  category: string
  tags: string[]
  readingTime?: number
  commentsCount?: number
  createdAt: string
}

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Linear 风格界面设计探索',
    excerpt: '从色彩、间距到微交互，拆解 Linear 的设计语言，并给出可落地的实现建议。',
    category: '设计',
    tags: ['UI', 'Linear', '设计系统'],
    readingTime: 10,
    commentsCount: 12,
    createdAt: '2024-12-10',
    content: '## Linear 风格界面设计探索\n\nLinear 的界面以克制、清晰和高信息密度著称……',
  },
  {
    id: '2',
    title: '如何写出打动用户的文案',
    excerpt: '好的文案不是堆砌辞藻，而是精准击中用户痛点与情绪。',
    category: '运营',
    tags: ['文案', '增长', '转化'],
    readingTime: 8,
    commentsCount: 5,
    createdAt: '2024-12-05',
  },
  {
    id: '3',
    title: '前端性能优化的 10 个技巧',
    excerpt: '从加载到交互，系统性提升 Web 应用性能的实用清单。',
    category: '技术',
    tags: ['性能', '前端', '优化'],
    readingTime: 12,
    commentsCount: 18,
    createdAt: '2024-11-28',
  },
]

export function getArticle(id: string): Article | undefined {
  return mockArticles.find((a) => a.id === id)
}
