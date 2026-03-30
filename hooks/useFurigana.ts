'use client'

import { useState, useEffect, useRef } from 'react'
import type { TranslatedLine } from '@/types/ai'

const BATCH_SIZE = 25

export function useFurigana(lines: string[] | null) {
  const [translatedLines, setTranslatedLines] = useState<TranslatedLine[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cache = useRef<Map<string, TranslatedLine[]>>(new Map())
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    if (!lines || lines.length === 0) {
      setTranslatedLines(null)
      return
    }

    const key = lines.join('||')
    if (key === lastKey.current) return
    lastKey.current = key

    if (cache.current.has(key)) {
      setTranslatedLines(cache.current.get(key)!)
      return
    }

    setLoading(true)
    setError(null)

    // Process in batches of 25 lines
    const batches: string[][] = []
    for (let i = 0; i < lines.length; i += BATCH_SIZE) {
      batches.push(lines.slice(i, i + BATCH_SIZE))
    }

    Promise.all(
      batches.map((batch) =>
        fetch('/api/ai/furigana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines: batch }),
        }).then((res) => {
          if (!res.ok) throw new Error('Furigana request failed')
          return res.json().then((d) => d.lines as TranslatedLine[])
        })
      )
    )
      .then((batchResults) => {
        const all = batchResults.flat()
        cache.current.set(key, all)
        setTranslatedLines(all)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [lines])

  return { translatedLines, loading, error }
}
