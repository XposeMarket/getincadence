export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  date: string
  readingTime: number
  author: string
  tags?: string[]
}

export interface BlogPostMeta {
  slug: string
  title: string
  excerpt: string
  date: string
  readingTime: number
  author: string
  tags?: string[]
}
