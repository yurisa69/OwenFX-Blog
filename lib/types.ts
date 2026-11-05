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
