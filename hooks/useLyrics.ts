'use client'

import { useState, useEffect, useRef } from 'react'
import type { LyricsResult } from '@/types/ai'

export function useLyrics(track: string | null, artist: string | null) {
  const [result, setResult] = useState<LyricsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache: key = "track::artist"
  const cache = useRef<Map<string, LyricsResult>>(new Map())
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    if (!track || !artist) {
      setResult(null)
      return
    }

    const key = `${track}::${artist}`
    if (key === lastKey.current) return
    lastKey.current = key

    // Return cached result instantly
    if (cache.current.has(key)) {
      setResult(cache.current.get(key)!)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    const params = new URLSearchParams({ track, artist })
    fetch(`/api/lyrics?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch lyrics')
        return res.json() as Promise<LyricsResult>
      })
      .then((data) => {
        cache.current.set(key, data)
        setResult(data)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [track, artist])

  function invalidate(t: string, a: string) {
    cache.current.delete(`${t}::${a}`)
  }

  return { result, loading, error, invalidate }
}
