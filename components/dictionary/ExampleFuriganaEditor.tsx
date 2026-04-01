'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import type { FuriganaToken } from '@/types/ai'

const KANJI_RE = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/
const DEBOUNCE_MS = 900

interface Props {
  text: string
  tokens: FuriganaToken[] | null
  onTextChange: (text: string) => void
  onTokensChange: (tokens: FuriganaToken[] | null) => void
  disabled?: boolean
  textareaClassName: string
}

export default function ExampleFuriganaEditor({
  text,
  tokens,
  onTextChange,
  onTokensChange,
  disabled,
  textareaClassName,
}: Props) {
  const [annotating, setAnnotating] = useState(false)
  const [annotateError, setAnnotateError] = useState<string | null>(null)
  const isFirstRender = useRef(true)

  // Auto-annotate after the user stops typing; skip on initial mount so
  // pre-existing tokens (loaded from DB) are never clobbered.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!text.trim()) {
      onTokensChange(null)
      return
    }
    const timer = setTimeout(() => annotate(text), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps

  async function annotate(value: string) {
    setAnnotating(true)
    setAnnotateError(null)
    try {
      const res = await fetch('/api/ai/annotate-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Annotation failed')
      }
      const data = await res.json()
      onTokensChange(data.furigana as FuriganaToken[])
    } catch (e) {
      setAnnotateError(e instanceof Error ? e.message : 'Annotation failed')
    } finally {
      setAnnotating(false)
    }
  }

  function handleTextChange(value: string) {
    onTextChange(value)
    if (tokens !== null) onTokensChange(null)
    setAnnotateError(null)
  }

  function updateReading(index: number, value: string) {
    if (!tokens) return
    onTokensChange(tokens.map((t, i) => i === index ? { ...t, reading: value || null } : t))
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="例文..."
          disabled={disabled}
          className={`resize-none ${textareaClassName}`}
        />
        {annotating && (
          <Loader2
            size={13}
            className="absolute right-2.5 top-2.5 animate-spin text-indigo-400 dark:text-indigo-500"
          />
        )}
      </div>

      {annotateError && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {annotateError}{' '}
          <button
            type="button"
            onClick={() => annotate(text)}
            className="underline hover:no-underline"
          >
            Retry
          </button>
        </p>
      )}

      {tokens && tokens.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">Furigana</span>
            <button
              type="button"
              onClick={() => annotate(text)}
              disabled={annotating || !!disabled}
              title="Re-annotate with AI"
              className="rounded p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-40 dark:hover:text-indigo-400"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <div className="flex flex-wrap items-start gap-x-1 gap-y-2">
            {tokens.map((token, i) => {
              const hasKanji = KANJI_RE.test(token.original)
              return (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-sm leading-tight text-gray-800 dark:text-gray-200">
                    {token.original}
                  </span>
                  {hasKanji && (
                    <input
                      value={token.reading ?? ''}
                      onChange={(e) => updateReading(i, e.target.value)}
                      disabled={disabled}
                      placeholder="…"
                      style={{ width: `${Math.max(2.5, ((token.reading?.length ?? 1) + 0.5) * 0.85)}rem` }}
                      className="rounded border border-gray-300 px-0.5 py-0 text-center text-xs leading-tight text-indigo-600 outline-none focus:border-indigo-400 dark:border-gray-600 dark:bg-gray-700 dark:text-indigo-300"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
