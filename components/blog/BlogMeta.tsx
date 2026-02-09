import { format } from 'date-fns'
import { Clock } from 'lucide-react'

interface BlogMetaProps {
  date: string
  readingTime: number
  className?: string
}

export default function BlogMeta({ date, readingTime, className = '' }: BlogMetaProps) {
  const formatted = (() => {
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch {
      return date
    }
  })()

  return (
    <div className={`flex items-center gap-2 text-xs text-gray-400 ${className}`}>
      <time dateTime={date}>{formatted}</time>
      <span className="text-gray-300">·</span>
      <span className="flex items-center gap-1">
        <Clock size={12} />
        {readingTime} min read
      </span>
    </div>
  )
}
