'use client'

import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AccessDenied({ 
  title = 'Access Restricted',
  message = 'You don\'t have permission to access this page.',
  feature = 'this feature'
}: {
  title?: string
  message?: string
  feature?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
        <Shield size={32} className="text-amber-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 max-w-md mb-6">
        {message}
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Contact your organization admin to request access to {feature}.
      </p>
      <Link href="/dashboard" className="btn btn-primary gap-2">
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>
    </div>
  )
}
