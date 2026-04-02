'use client'

import { useState, useEffect, useCallback } from 'react'
import type { WordStat } from '@/types/database'

interface UseWordStatsResult {
  stats: Record<string, WordStat>
  loading: boolean
  submitSession: (results: { word_id: string; got_it: boolean }[]) => Promise<void>
}

export function useWordStats(): UseWordStatsResult {
  const [stats, setStats] = useState<Record<string, WordStat>>({})
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/word-stats')
      if (!res.ok) return
      const data = await res.json()
      const map: Record<string, WordStat> = {}
      for (const s of data.stats as WordStat[]) {
        map[s.word_id] = s
      }
      setStats(map)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const submitSession = useCallback(async (results: { word_id: string; got_it: boolean }[]) => {
    const res = await fetch('/api/word-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results }),
    })
    if (res.ok) {
      await fetchStats()
    }
  }, [fetchStats])

  return { stats, loading, submitSession }
}
