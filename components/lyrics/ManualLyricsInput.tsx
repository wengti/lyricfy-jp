'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import type { LrcLine } from '@/types/ai'
import { plainLinesToLrc } from '@/lib/utils/lrc-parser'

interface Props {
  onSubmit: (lines: LrcLine[]) => void
  heading?: string
}

export default function ManualLyricsInput({ onSubmit, heading = 'Lyrics not found — paste them manually' }: Props) {
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const rawLines = text.split('\n')
    const lines = plainLinesToLrc(rawLines)
    if (lines.length > 0) {
      onSubmit(lines)
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <FileText size={18} />
        <p className="text-sm font-medium">{heading}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Paste lyrics here, one line per row… Japanese preferred (e.g. 好きすぎたから愛せなかった). Romaji also accepted but may reduce accuracy."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-indigo-800"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Annotate with furigana
        </button>
      </form>
    </div>
  )
}
