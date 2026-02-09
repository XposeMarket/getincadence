import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BlogPostMeta } from '@/lib/blog/types'
import BlogMeta from './BlogMeta'

interface BlogCardProps {
  post: BlogPostMeta
  featured?: boolean
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group block bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 ${
        featured ? 'p-6 sm:p-8' : 'p-5 sm:p-6'
      }`}
    >
      <article>
        <h3
          className={`font-semibold text-gray-900 group-hover:text-primary-600 transition-colors leading-snug ${
            featured ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
          }`}
        >
          {post.title}
        </h3>

        <p className={`text-gray-500 mt-2 line-clamp-2 ${featured ? 'text-base' : 'text-sm'}`}>
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between mt-4">
          <BlogMeta date={post.date} readingTime={post.readingTime} />
          <ArrowRight
            size={16}
            className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </article>
    </Link>
  )
}
