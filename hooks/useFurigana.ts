'use client'

import { useState, useEffect, useRef } from 'react'
import type { TranslatedLine } from '@/types/ai'

export function useFurigana(
  lines: string[] | null,
  track: string | null,
  artist: string | null,
  bust = 0  // increment to force a re-fetch and overwrite the cache
) {
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

    const key = `${track ?? ''}::${artist ?? ''}::${bust}`
    if (key === lastKey.current) return
    lastKey.current = key

    // On a forced bust, drop the in-memory cache for this track so stale
    // results from a previous fetch aren't returned.
    if (bust > 0) {
      const staleKey = `${track ?? ''}::${artist ?? ''}::${bust - 1}`
      cache.current.delete(staleKey)
    }

    if (cache.current.has(key)) {
      setTranslatedLines(cache.current.get(key)!)
      return
    }

    setLoading(true)
    setError(null)
    setTranslatedLines(null)

    let stale = false

    fetch('/api/ai/furigana', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines, track, artist, force: bust > 0 }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error ?? 'Furigana request failed') })
        return res.json().then((d) => d.lines as TranslatedLine[])
      })
      .then((result) => {
        if (stale) return
        cache.current.set(key, result)
        setTranslatedLines(result)
      })
      .catch((e) => {
        if (stale) return
        setError(e instanceof Error ? e.message : 'Unknown error')
      })
      .finally(() => {
        if (!stale) setLoading(false)
      })

    return () => {
      stale = true
      lastKey.current = null
    }
  }, [lines, track, artist, bust])

  return { translatedLines, loading, error }
}
