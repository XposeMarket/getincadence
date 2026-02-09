import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Blog – Cadence CRM',
  description: 'Practical writing on CRM, sales workflows, and running a small business without enterprise software.',
  openGraph: {
    title: 'Cadence Blog',
    description: 'Practical writing on CRM, sales workflows, and running a small business without enterprise software.',
    type: 'website',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation — same style as marketing but with Blog active */}
      <nav className="sticky top-0 z-50 bg-white/78 backdrop-blur-md border-b border-gray-200/70">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center justify-between py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Cadence"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-bold text-lg tracking-tight">Cadence</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/product"
                className="px-3 py-2 text-sm rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Product
              </Link>
              <Link
                href="/pricing"
                className="px-3 py-2 text-sm rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                className="px-3 py-2 text-sm rounded-lg text-gray-900 bg-gray-100 transition-colors"
              >
                Blog
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-2.5">
              <Link
                href="/login"
                className="px-3.5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-2.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors shadow-lg shadow-primary-500/25"
              >
                Start free
              </Link>
            </div>

            {/* Mobile: minimal nav */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                href="/blog"
                className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg"
              >
                Blog
              </Link>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-primary-600"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/60 mt-16">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Cadence. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Blog
              </Link>
              <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
