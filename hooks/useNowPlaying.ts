'use client'

import { useState, useEffect, useRef } from 'react'
import type { NowPlayingState } from '@/types/spotify'

interface UseNowPlayingResult {
  connected: boolean
  playing: NowPlayingState | null
  loading: boolean
  error: string | null
}

const POLL_INTERVAL = 3000

export function useNowPlaying(): UseNowPlayingResult {
  const [connected, setConnected] = useState(false)
  const [playing, setPlaying] = useState<NowPlayingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function poll() {
    try {
      const res = await fetch('/api/spotify/now-playing')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setConnected(data.connected ?? false)
      setPlaying(data.playing ?? null)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { connected, playing, loading, error }
}
