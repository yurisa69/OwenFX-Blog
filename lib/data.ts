export type Post = {
  slug: string
  title: string
  excerpt: string
  category: { label: string }
}

export const author = { name: 'OwenFX', bio: '设计与技术' }
export const tags: [string, number][] = [['设计', 12], ['产品', 9], ['前端', 8]]
export const posts: Post[] = []
