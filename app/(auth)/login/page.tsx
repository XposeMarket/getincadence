'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Get redirect URL and plan from query params
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const selectedPlan = searchParams.get('plan')
  const billingPeriod = searchParams.get('period') || 'monthly'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If user came from pricing with a plan, go directly to checkout
    if (selectedPlan && ['starter', 'team', 'growth'].includes(selectedPlan)) {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            plan: selectedPlan, 
            period: billingPeriod 
          }),
        })

        const data = await res.json()

        if (res.ok && data.url) {
          // Redirect directly to Stripe checkout
          window.location.href = data.url
          return
        }
      } catch (err) {
        console.error('Auto-checkout error:', err)
        // Fall through to normal redirect if checkout fails
      }
    }

    // Normal redirect to dashboard or specified page
    router.push(redirectTo)
    router.refresh()
  }

  const handleDemoMode = () => {
    router.push('/dashboard')
  }

  // Build signup link with redirect params
  const signupParams = new URLSearchParams()
  if (redirectTo !== '/dashboard') signupParams.set('redirect', redirectTo)
  if (selectedPlan) signupParams.set('plan', selectedPlan)
  if (billingPeriod !== 'monthly') signupParams.set('period', billingPeriod)
  const signupHref = signupParams.toString() ? `/signup?${signupParams.toString()}` : '/signup'

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
      <p className="text-gray-600 mb-8">Sign in to your Cadence account</p>

      {selectedPlan && (
        <div className="mb-6 p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">
          Sign in to continue with the <span className="font-semibold capitalize">{selectedPlan}</span> plan
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="input"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input pr-10"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full h-11"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              {selectedPlan ? 'Continuing to checkout...' : 'Signing in...'}
            </>
          ) : (
            selectedPlan ? `Continue to ${selectedPlan} plan` : 'Sign in'
          )}
        </button>
      </form>

      {!selectedPlan && (
        <div className="mt-4">
          <button
            onClick={handleDemoMode}
            className="btn btn-secondary w-full h-11"
          >
            Enter Demo Mode
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link href={signupHref} className="font-medium text-primary-600 hover:text-primary-500">
          Create one
        </Link>
      </p>
    </div>
  )
}

function LoginFormFallback() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
      <p className="text-gray-600 mb-8">Sign in to your Cadence account</p>
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  )
}
