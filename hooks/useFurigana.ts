'use client'

import { useState, useEffect, useRef } from 'react'
import type { TranslatedLine } from '@/types/ai'

export function useFurigana(
  lines: string[] | null,
  track: string | null,
  artist: string | null,
  bust = 0,          // increment to force a re-fetch and overwrite the cache
  wasRomaji = false, // lyrics were romaji-converted — tells furigana to persist as 'manual'
  timestamps?: number[], // original ms timestamps (for synced cache storage)
  synced?: boolean,      // whether original lyrics had LRC timestamps
) {
  const [translatedLines, setTranslatedLines] = useState<TranslatedLine[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cache = useRef<Map<string, TranslatedLine[]>>(new Map())
  const lastKey = useRef<string | null>(null)
  const prevTrackRef = useRef<{ track: string | null; artist: string | null }>({ track, artist })
  const prevLinesRef = useRef<string[] | null>(null)

  useEffect(() => {
    if (!lines || lines.length === 0) {
      setTranslatedLines(null)
      prevLinesRef.current = lines
      return
    }

    // If the track itself changed, treat bust as 0 — the component's reset effect
    // fires after this effect, so bust may still hold the previous song's value.
    const trackChanged =
      prevTrackRef.current.track !== track || prevTrackRef.current.artist !== artist
    const linesChanged = lines !== prevLinesRef.current
    prevTrackRef.current = { track, artist }
    prevLinesRef.current = lines

    // When the track changes, lines from the previous song may still be in flight
    // (rawLines is derived from lyricsResult which clears one render tick after
    // track updates). Skip this run — the effect will fire again once lyricsResult
    // settles on the new song's data, at which point linesChanged will be true.
    if (trackChanged && !linesChanged) {
      setTranslatedLines(null)
      setError(null)
      return
    }

    const effectiveBust = trackChanged ? 0 : bust

    const key = `${track ?? ''}::${artist ?? ''}::${effectiveBust}`
    if (key === lastKey.current) return
    lastKey.current = key

    // On a forced bust, drop the in-memory cache for this track so stale
    // results from a previous fetch aren't returned.
    if (effectiveBust > 0) {
      const staleKey = `${track ?? ''}::${artist ?? ''}::${effectiveBust - 1}`
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
      body: JSON.stringify({
        lines, track, artist, force: effectiveBust > 0,
        ...(wasRomaji ? { wasRomaji: true, timestamps } : {}),
        ...(synced !== undefined ? { synced } : {}),
      }),
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
