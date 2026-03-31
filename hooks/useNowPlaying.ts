'use client'

import { useState, useEffect, useRef } from 'react'
import type { NowPlayingState } from '@/types/spotify'

interface UseNowPlayingResult {
  connected: boolean
  playing: NowPlayingState | null
  loading: boolean
  error: string | null
  seekVersion: number
}

const POLL_INTERVAL = 3000
const TICK_INTERVAL = 100
const SEEK_THRESHOLD = 2000

export function useNowPlaying(): UseNowPlayingResult {
  const [connected, setConnected] = useState(false)
  const [playing, setPlaying] = useState<NowPlayingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seekVersion, setSeekVersion] = useState(0)

  // Track when the last poll happened so we can interpolate progressMs locally
  const fetchedAtRef = useRef<number>(0)
  const isPlayingRef = useRef<boolean>(false)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Track last poll's progress and time to detect seeks
  const lastPollProgressRef = useRef<number>(0)
  const lastPollTimeRef = useRef<number>(0)

  async function poll() {
    const now = Date.now()
    try {
      const res = await fetch('/api/spotify/now-playing')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const newProgress: number = data.playing?.progressMs ?? 0
      const newIsPlaying: boolean = data.playing?.isPlaying ?? false

      // Detect seek: compare API progress against locally-interpolated expectation
      if (newIsPlaying && lastPollTimeRef.current > 0) {
        const elapsed = now - lastPollTimeRef.current
        const expectedProgress = lastPollProgressRef.current + elapsed
        if (Math.abs(newProgress - expectedProgress) > SEEK_THRESHOLD) {
          setSeekVersion((v) => v + 1)
        }
      }
      lastPollProgressRef.current = newProgress
      lastPollTimeRef.current = now

      setConnected(data.connected ?? false)
      setPlaying(data.playing ?? null)
      fetchedAtRef.current = Date.now()
      isPlayingRef.current = newIsPlaying
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    poll()
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL)

    // Tick every 100ms to interpolate progressMs between polls
    tickIntervalRef.current = setInterval(() => {
      if (!isPlayingRef.current || fetchedAtRef.current === 0) return
      const elapsed = Date.now() - fetchedAtRef.current
      setPlaying((prev) => {
        if (!prev) return prev
        return { ...prev, progressMs: prev.progressMs + elapsed }
      })
      fetchedAtRef.current = Date.now()
    }, TICK_INTERVAL)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current)
    }
  }, [])

  return { connected, playing, loading, error, seekVersion }
}
