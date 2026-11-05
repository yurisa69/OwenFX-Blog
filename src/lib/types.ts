export type Software = {
  id: string
  title: string
  slug?: string
  description: string
  category: string
  tags: string[]
  featured?: boolean
  downloads?: number
  size?: string
  version?: string
  platform?: string[]
  image?: string
  downloadUrl?: string
  createdAt?: string
}

export type Article = {
  id: string
  title: string
  slug?: string
  excerpt: string
  content?: string
  category: string
  tags: string[]
  cover?: string
  readingTime?: number
  commentsCount?: number
  createdAt: string
  author?: string
}
