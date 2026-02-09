import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getAllSlugs, getPostBySlug, getRelatedPosts } from '@/lib/blog/get-posts'
import { markdownToHtml } from '@/lib/blog/parse-markdown'
import BlogMeta from '@/components/blog/BlogMeta'
import BlogCard from '@/components/blog/BlogCard'
import type { Metadata } from 'next'

interface BlogPostPageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  const slugs = getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}

  return {
    title: `${post.title} – Cadence CRM Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const htmlContent = await markdownToHtml(post.content)
  const relatedPosts = getRelatedPosts(post.slug, 3)

  return (
    <div className="max-w-5xl mx-auto px-5 py-10 sm:py-14">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        All posts
      </Link>

      <article className="max-w-[720px] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <BlogMeta date={post.date} readingTime={post.readingTime} className="text-sm" />
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">Written by the {post.author}</span>
          </div>
        </header>

        {/* Content */}
        <div
          className="prose prose-gray prose-lg max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:text-gray-600
            prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
            prose-li:text-gray-600
            prose-blockquote:border-primary-300 prose-blockquote:text-gray-500 prose-blockquote:not-italic
            prose-strong:text-gray-900
            prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Soft close */}
        <footer className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-gray-500 text-sm leading-relaxed">
            This is the kind of problem Cadence was built to solve — a free CRM designed for
            small businesses who need clarity, not complexity.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Explore Cadence
            <ArrowRight size={14} />
          </Link>
        </footer>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-5xl mx-auto mt-16 pt-10 border-t border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Keep reading</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedPosts.map((related) => (
              <BlogCard key={related.slug} post={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
