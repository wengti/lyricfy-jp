import { parseLrc, plainLinesToLrc } from '@/lib/utils/lrc-parser'
import type { LrcLine } from '@/types/ai'

const LRCLIB_BASE = 'https://lrclib.net/api'

interface LrclibResult {
  lines: LrcLine[]
  synced: boolean
}

export async function getLyricsFromLrclib(
  track: string,
  artist: string
): Promise<LrclibResult | null> {
  const params = new URLSearchParams({ track_name: track, artist_name: artist })
  const res = await fetch(`${LRCLIB_BASE}/get?${params}`, {
    headers: { 'User-Agent': 'LyricfyJP/1.0 (https://github.com/lyricfy-jp)' },
    cache: 'no-store',
  })

  if (res.status === 404) return null
  if (!res.ok) return null

  const data = await res.json()

  if (data.syncedLyrics) {
    const lines = parseLrc(data.syncedLyrics)
    if (lines.length > 0) return { lines, synced: true }
  }

  if (data.plainLyrics) {
    const lines = plainLinesToLrc(
      data.plainLyrics.split('\n').map((l: string) => l.trim()).filter(Boolean)
    )
    if (lines.length > 0) return { lines, synced: false }
  }

  return null
}
