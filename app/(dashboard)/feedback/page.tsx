'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { 
  MessageSquarePlus, Bug, Lightbulb, Palette, MessageCircle, HelpCircle,
  Send, CheckCircle, Clock, Eye, XCircle, Loader2, ChevronDown, ChevronUp,
  Sparkles
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Category = 'bug' | 'feature' | 'ui' | 'general' | 'other'
type Priority = 'low' | 'medium' | 'high' | 'critical'
type Status = 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'wont_fix'

interface FeedbackItem {
  id: string
  category: Category
  priority: Priority
  subject: string
  message: string
  status: Status
  created_at: string
}

const categories: { id: Category; label: string; icon: typeof Bug; color: string; description: string }[] = [
  { 
    id: 'bug', 
    label: 'Bug Report', 
    icon: Bug, 
    color: 'text-red-600 bg-red-100 border-red-200',
    description: 'Something is broken or not working as expected'
  },
  { 
    id: 'feature', 
    label: 'Feature Request', 
    icon: Lightbulb, 
    color: 'text-amber-600 bg-amber-100 border-amber-200',
    description: 'Suggest a new feature or improvement'
  },
  { 
    id: 'ui', 
    label: 'UI/UX Feedback', 
    icon: Palette, 
    color: 'text-purple-600 bg-purple-100 border-purple-200',
    description: 'Design, layout, or usability feedback'
  },
  { 
    id: 'general', 
    label: 'General Feedback', 
    icon: MessageCircle, 
    color: 'text-blue-600 bg-blue-100 border-blue-200',
    description: 'General thoughts, praise, or suggestions'
  },
  { 
    id: 'other', 
    label: 'Other', 
    icon: HelpCircle, 
    color: 'text-gray-600 bg-gray-100 border-gray-200',
    description: 'Anything else on your mind'
  },
]

const priorities: { id: Priority; label: string; color: string }[] = [
  { id: 'low', label: 'Low', color: 'text-gray-600 bg-gray-100' },
  { id: 'medium', label: 'Medium', color: 'text-blue-600 bg-blue-100' },
  { id: 'high', label: 'High', color: 'text-orange-600 bg-orange-100' },
  { id: 'critical', label: 'Critical', color: 'text-red-600 bg-red-100' },
]

const statusConfig: Record<Status, { label: string; icon: typeof Clock; color: string }> = {
  new: { label: 'New', icon: Sparkles, color: 'text-blue-600 bg-blue-100' },
  reviewed: { label: 'Reviewed', icon: Eye, color: 'text-purple-600 bg-purple-100' },
  in_progress: { label: 'In Progress', icon: Loader2, color: 'text-amber-600 bg-amber-100' },
  resolved: { label: 'Resolved', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  wont_fix: { label: "Won't Fix", icon: XCircle, color: 'text-gray-600 bg-gray-100' },
}

export default function FeedbackPage() {
  const pathname = usePathname()
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [priority, setPriority] = useState<Priority>('medium')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // History state
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  // Fetch user's feedback history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/feedback')
        if (res.ok) {
          const data = await res.json()
          setFeedbackHistory(data.feedback || [])
        }
      } catch (err) {
        console.error('Failed to fetch feedback history:', err)
      } finally {
        setLoadingHistory(false)
      }
    }
    fetchHistory()
  }, [submitted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCategory) {
      setError('Please select a category')
      return
    }
    
    if (!subject.trim()) {
      setError('Please enter a subject')
      return
    }
    
    if (!message.trim()) {
      setError('Please enter your feedback')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          priority,
          subject: subject.trim(),
          message: message.trim(),
          pageUrl: pathname,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSubmitted(true)
      // Reset form after short delay
      setTimeout(() => {
        setSelectedCategory(null)
        setPriority('medium')
        setSubject('')
        setMessage('')
        setSubmitted(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryConfig = (cat: Category) => categories.find(c => c.id === cat)
  const getPriorityConfig = (pri: Priority) => priorities.find(p => p.id === pri)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">
          Help us improve Cadence by sharing your thoughts, reporting bugs, or suggesting features.
        </p>
      </div>

      {/* Success State */}
      {submitted ? (
        <div className="card p-8 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600">
            Your feedback has been submitted. We truly appreciate you taking the time to help us improve.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Category Selection */}
          <div className="card p-4 sm:p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              What type of feedback is this? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedCategory === cat.id
                      ? `${cat.color} border-current ring-2 ring-offset-2`
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedCategory === cat.id ? 'bg-white/50' : cat.color.split(' ')[1]
                    }`}>
                      <cat.icon size={20} className={selectedCategory === cat.id ? 'text-current' : cat.color.split(' ')[0]} />
                    </div>
                    <div>
                      <p className={`font-medium ${selectedCategory === cat.id ? 'text-current' : 'text-gray-900'}`}>
                        {cat.label}
                      </p>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ${selectedCategory === cat.id ? 'text-current opacity-80' : 'text-gray-500'}`}>
                    {cat.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Subject & Priority */}
          <div className="card p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your feedback"
                className="input"
                maxLength={100}
              />
              <p className="text-xs text-gray-400 mt-1">{subject.length}/100 characters</p>
            </div>

            {/* Priority - only show for bugs */}
            {selectedCategory === 'bug' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorities.map((pri) => (
                    <button
                      key={pri.id}
                      type="button"
                      onClick={() => setPriority(pri.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        priority === pri.id
                          ? `${pri.color} ring-2 ring-offset-1`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pri.label}
                    </button>
                  ))}
                </div>
                {priority === 'critical' && (
                  <p className="text-xs text-red-600 mt-2">
                    Critical = App is unusable or data is at risk
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          <div className="card p-4 sm:p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Your Feedback *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                selectedCategory === 'bug'
                  ? "Please describe the issue in detail:\n• What were you trying to do?\n• What happened instead?\n• Steps to reproduce (if possible)"
                  : selectedCategory === 'feature'
                  ? "Describe the feature you'd like to see:\n• What problem does it solve?\n• How would it work?"
                  : selectedCategory === 'ui'
                  ? "Tell us about the UI/UX issue:\n• What's confusing or difficult?\n• How could it be improved?"
                  : "Share your thoughts with us..."
              }
              rows={6}
              className="input resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 mt-1">{message.length}/2000 characters</p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Your feedback is private and only visible to the Cadence team.
            </p>
            <button
              type="submit"
              disabled={submitting || !selectedCategory || !subject.trim() || !message.trim()}
              className="btn btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Feedback History */}
      {feedbackHistory.length > 0 && (
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquarePlus size={18} className="text-gray-500" />
              <span className="font-medium text-gray-900">Your Previous Feedback</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {feedbackHistory.length}
              </span>
            </div>
            {showHistory ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>

          {showHistory && (
            <div className="border-t border-gray-200 divide-y divide-gray-100">
              {feedbackHistory.map((item) => {
                const catConfig = getCategoryConfig(item.category)
                const statusConf = statusConfig[item.status]
                const StatusIcon = statusConf.icon
                return (
                  <div key={item.id} className="px-4 sm:px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${catConfig?.color || ''}`}>
                            {catConfig && <catConfig.icon size={12} />}
                            {catConfig?.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConf.color}`}>
                            <StatusIcon size={12} className={item.status === 'in_progress' ? 'animate-spin' : ''} />
                            {statusConf.label}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mt-1">{item.subject}</p>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.message}</p>
                      </div>
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      <div className="text-center text-sm text-gray-500 pb-8">
        <p>
          Need immediate help?{' '}
          <a href="mailto:support@getincadence.com" className="text-primary-600 hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
