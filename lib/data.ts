export type Tag = { label: string; tone: 'violet' | 'amber' | 'blue' | 'pink' | 'green' }

export type Post = {
  slug: string
  title: string
  excerpt: string
  category: Tag
  date: string
  minutes: number
  comments: number
  progress: number
  cover: string
  content: string
}

export const author = {
  name: 'OwenFX',
  bio: '探索设计、技术与产品的无限可能。',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
}

export const posts: Post[] = [
  {
    slug: 'linear-style-ui-exploration',
    title: 'Linear 风格界面设计探索',
    excerpt: '探索 Linear 风格的设计语言，分析其简洁、高效和专注的核心原则，并在实际项目中应用。',
    category: { label: '界面设计', tone: 'violet' },
    date: '2023/12/10',
    minutes: 10,
    comments: 12,
    progress: 70,
    cover: '/placeholder-1.svg',
    content: `
# 什么是 Linear 风格

Linear 是一种以简洁、高效和专注为核心的设计风格。它通过克制的配色、清晰的层级、精致的细节，帮助用户更专注于内容本身。

> 核心原则：少即是多、信息层级清晰、细节精致、交互自然。

## 设计特点

### 2.1 极简的视觉

通过低饱和度的色彩、充足的留白和一致的圆角，营造出干净、舒适的视觉体验。

### 2.2 克制的动效

动效应该服务于理解，而不是抢占注意力。推荐使用 160–240ms 的自然缓动，让卡片、按钮和抽屉拥有轻微但明确的反馈。

### 2.3 深色玻璃质感

透明层叠加轻微模糊和细描边，可以让复杂页面保持层次感。重点不是“玻璃”，而是让背景、内容和交互建立稳定的空间关系。
    `.trim(),
  },
  {
    slug: 'copywriting-that-converts',
    title: '如何写出打动用户的文案',
    excerpt: '分享在产品运营中，如何通过文案传递价值、建立信任，并驱动用户行动。',
    category: { label: '运营文案', tone: 'pink' },
    date: '2023/12/09',
    minutes: 8,
    comments: 8,
    progress: 90,
    cover: '/placeholder-2.svg',
    content: `# 如何写出打动用户的文案

先说结论：好的文案不是“写得漂亮”，而是让用户更快理解自己为什么要继续下一步。

## 价值优先

先告诉用户结果，再解释实现方式。标题负责建立预期，正文负责降低理解成本，按钮负责给出明确行动。

## 每一个词都要有目的

删除重复的形容词，把“我们很专业”替换成可以验证的事实，让用户自己得出结论。
    `.trim(),
  },
  {
    slug: 'frontend-performance-10-tips',
    title: '前端性能优化的 10 个技巧',
    excerpt: '从加载、渲染到交互，全面梳理前端性能优化的实用技巧和最佳实践。',
    category: { label: '前端开发', tone: 'amber' },
    date: '2023/12/08',
    minutes: 12,
    comments: 15,
    progress: 10,
    cover: '/placeholder-3.svg',
    content: `# 前端性能优化的 10 个技巧

性能优化不是“把 Lighthouse 分数做到满分”，而是让真实用户更快看到内容、更少等待。

## 优先级

首先关注网络请求数量、资源体积、首屏渲染和长任务，再处理微优化。

## 常用手段

静态资源缓存、图片现代格式、按需加载、代码分割、服务端渲染以及减少不必要的客户端 JavaScript，往往比局部细节更有价值。
    `.trim(),
  },
  {
    slug: 'social-media-publishing-rhythm',
    title: '新媒体发布的节奏与策略',
    excerpt: '分析新媒体内容发布的最佳节奏和策略，帮助你在不同平台获得更好的曝光。',
    category: { label: '新媒体运营', tone: 'blue' },
    date: '2023/12/07',
    minutes: 6,
    comments: 6,
    progress: 50,
    cover: '/placeholder-4.svg',
    content: `# 新媒体发布的节奏与策略

稳定、可复制、可复盘，比偶尔爆发更重要。

## 建立内容日历

为栏目设定固定的生产节奏，让主题、封面、标题和发布时间形成长期数据。
    `.trim(),
  },
  {
    slug: 'campaign-copy-guide',
    title: '活动运营文案撰写指南',
    excerpt: '从目标设定到文案撰写，完整拆解活动运营文案的创作流程和要点。',
    category: { label: '运营文案', tone: 'green' },
    date: '2023/12/06',
    minutes: 9,
    comments: 4,
    progress: 60,
    cover: '/placeholder-5.svg',
    content: `# 活动运营文案撰写指南

活动文案要让用户在极短时间内理解三个问题：为什么现在参加、参加能得到什么、下一步应该做什么。
    `.trim(),
  },
]

export const tags = [
  ['设计', 12], ['产品', 9], ['前端', 8], ['运营', 7], ['React', 6], ['思考', 5]
]
