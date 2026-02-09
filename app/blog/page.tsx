import { getAllPosts } from '@/lib/blog/get-posts'
import BlogHeader from '@/components/blog/BlogHeader'
import BlogCard from '@/components/blog/BlogCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog – Free CRM for Small Businesses | Cadence',
  description:
    'Practical writing on CRM, sales workflows, and running a small business without enterprise software. By the Cadence team.',
}

export default function BlogIndexPage() {
  const posts = getAllPosts()
  const [featured, ...rest] = posts

  return (
    <div className="max-w-5xl mx-auto px-5 py-12 sm:py-16">
      <BlogHeader />

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Posts coming soon.</p>
        </div>
      ) : (
        <>
          {/* Featured post */}
          {featured && (
            <div className="mb-8">
              <BlogCard post={featured} featured />
            </div>
          )}

          {/* Post grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
