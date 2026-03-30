'use client'

import { useState, useEffect, useRef } from 'react'
import type { TranslatedLine } from '@/types/ai'

export function useFurigana(lines: string[] | null, track: string | null, artist: string | null) {
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

    const key = `${track ?? ''}::${artist ?? ''}::${lines.join('||')}`
    if (key === lastKey.current) return
    lastKey.current = key

    if (cache.current.has(key)) {
      setTranslatedLines(cache.current.get(key)!)
      return
    }

    setLoading(true)
    setError(null)
    setTranslatedLines(null)

    fetch('/api/ai/furigana', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines, track, artist }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error ?? 'Furigana request failed') })
        return res.json().then((d) => d.lines as TranslatedLine[])
      })
      .then((result) => {
        cache.current.set(key, result)
        setTranslatedLines(result)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [lines, track, artist])

  return { translatedLines, loading, error }
}
