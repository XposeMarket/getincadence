import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import { BlogPost, BlogPostMeta } from './types'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

/**
 * Get all blog post metadata, sorted by date (newest first).
 * Does NOT include full content — use getPostBySlug for that.
 */
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))

  const posts: BlogPostMeta[] = files.map(filename => {
    const slug = filename.replace(/\.md$/, '')
    const filePath = path.join(BLOG_DIR, filename)
    const fileContents = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContents)
    const stats = readingTime(content)

    return {
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || '',
      date: data.date || '',
      readingTime: Math.ceil(stats.minutes),
      author: data.author || 'Cadence Team',
      tags: data.tags || [],
    }
  })

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Get a single blog post by slug, including full rendered content.
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`)

  if (!fs.existsSync(filePath)) return null

  const fileContents = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContents)
  const stats = readingTime(content)

  return {
    slug,
    title: data.title || slug,
    excerpt: data.excerpt || '',
    content,
    date: data.date || '',
    readingTime: Math.ceil(stats.minutes),
    author: data.author || 'Cadence Team',
    tags: data.tags || [],
  }
}

/**
 * Get all slugs for static generation.
 */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  return fs
    .readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''))
}

/**
 * Get related posts based on shared tags. Falls back to most recent if no tag overlap.
 */
export function getRelatedPosts(currentSlug: string, count: number = 3): BlogPostMeta[] {
  const allPosts = getAllPosts()
  const current = allPosts.find(p => p.slug === currentSlug)
  if (!current) return allPosts.filter(p => p.slug !== currentSlug).slice(0, count)

  const currentTags = new Set(current.tags || [])
  const others = allPosts.filter(p => p.slug !== currentSlug)

  if (currentTags.size === 0) return others.slice(0, count)

  // Score by number of shared tags
  const scored = others.map(post => ({
    post,
    score: (post.tags || []).filter(t => currentTags.has(t)).length,
  }))

  scored.sort((a, b) => b.score - a.score || new Date(b.post.date).getTime() - new Date(a.post.date).getTime())

  return scored.slice(0, count).map(s => s.post)
}
