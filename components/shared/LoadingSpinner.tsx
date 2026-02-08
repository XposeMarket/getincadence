'use client'

interface LoadingSpinnerProps {
  /** Optional message to display below the spinner */
  message?: string
  /** Size variant - 'sm' for inline/buttons, 'md' for sections, 'lg' for full page */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to center in full viewport */
  fullScreen?: boolean
  /** Additional className */
  className?: string
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
}

export default function LoadingSpinner({ 
  message, 
  size = 'md', 
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const videoSize = sizeClasses[size]
  
  // For inline/button usage, use a simpler approach
  if (size === 'sm') {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`${videoSize} object-contain ${className}`}
      >
        <source src="/cadence-loader.mp4" type="video/mp4" />
      </video>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${
      fullScreen ? 'fixed inset-0 bg-white/95 backdrop-blur-sm z-50' : 'py-8'
    } ${className}`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`${videoSize} object-contain`}
      >
        <source src="/cadence-loader.mp4" type="video/mp4" />
      </video>
      {message && (
        <p className="text-gray-600 text-sm font-medium animate-pulse">{message}</p>
      )}
    </div>
  )
}

/**
 * Inline spinner for buttons - just the video, no wrapper
 * Use this inside buttons: {loading ? <ButtonSpinner /> : 'Submit'}
 */
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className={`w-4 h-4 object-contain inline-block ${className}`}
    >
      <source src="/cadence-loader.mp4" type="video/mp4" />
    </video>
  )
}
