export type Software = {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  featured?: boolean
  downloads?: number
  size?: string
  version?: string
  platform?: string[]
  downloadUrl?: string
}

export const categoryOrder = ['AI工具', '效率办公', '开发工具', '设计创意', '系统工具', '多媒体']

export const categoryColors: Record<string, string> = {
  'AI工具': '#a855f7',
  '效率办公': '#3b82f6',
  '开发工具': '#10b981',
  '设计创意': '#f59e0b',
  '系统工具': '#ef4444',
  '多媒体': '#06b6d4',
}

export const mockSoftware: Software[] = [
  {
    id: '1',
    title: 'Cursor',
    description: 'AI 驱动的代码编辑器，基于 VS Code，内置强大的 AI 编程助手。',
    category: 'AI工具',
    tags: ['AI', '编辑器', '编程'],
    featured: true,
    downloads: 12800,
    size: '180 MB',
    version: '0.45',
    platform: ['Windows', 'macOS', 'Linux'],
  },
  {
    id: '2',
    title: 'Notion',
    description: '全能笔记与协作工具，支持数据库、看板、文档一体化。',
    category: '效率办公',
    tags: ['笔记', '协作', '知识库'],
    featured: true,
    downloads: 25600,
    size: '120 MB',
    version: '3.0',
    platform: ['Windows', 'macOS', 'Web'],
  },
]
