'use client'

import { useEffect, useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface Props {
  message: string
  duration?: number // ms before auto-dismiss, default 6000
  onDismiss: () => void
}

export default function Toast({ message, duration = 6000, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)

  // Fade in on mount
  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(show)
  }, [])

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg transition-all duration-300 dark:border-red-800 dark:bg-gray-900 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500 dark:text-red-400" />
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      <button
        onClick={onDismiss}
        className="ml-auto shrink-0 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  )
}
