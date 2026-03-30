'use client'

import { useState } from 'react'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'

interface Props {
  id: string
  label: string
  value: string
  savedValue: string | null
  onChange: (value: string) => void
  placeholder?: string
  helpText?: string
}

export default function ApiKeyInput({
  id,
  label,
  value,
  savedValue,
  onChange,
  placeholder = 'Paste your key here',
  helpText,
}: Props) {
  const [show, setShow] = useState(false)
  const isSaved = savedValue !== null
  const hasUnsavedChange = value.trim() !== ''

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isSaved ? savedValue! : placeholder}
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-indigo-800"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label={show ? 'Hide key' : 'Show key'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Status indicators */}
      <div className="mt-1.5 flex items-center gap-3 text-xs">
        {isSaved && !hasUnsavedChange && (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 size={12} />
            Saved: {savedValue}
          </span>
        )}
        {hasUnsavedChange && (
          <span className="text-amber-600 dark:text-amber-400">Unsaved change</span>
        )}
        {helpText && <span className="text-gray-400 dark:text-gray-500">{helpText}</span>}
      </div>
    </div>
  )
}
