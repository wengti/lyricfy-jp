import { parseLrc, plainLinesToLrc } from '@/lib/utils/lrc-parser'
import type { LrcLine } from '@/types/ai'

const LRCLIB_BASE = 'https://lrclib.net/api'
const HEADERS = { 'User-Agent': 'LyricfyJP/1.0 (https://github.com/wengti/lyricfy-jp)' }

interface LrclibResult {
  lines: LrcLine[]
  synced: boolean
}

interface LrclibEntry {
  trackName: string
  artistName: string
  syncedLyrics: string | null
  plainLyrics: string | null
}

function entryToResult(data: LrclibEntry): LrclibResult | null {
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

export async function getLyricsFromLrclib(
  track: string,
  artist: string
): Promise<LrclibResult | null> {
  // 1. Exact match — fastest, works when Spotify name matches lrclib exactly
  const exactParams = new URLSearchParams({ track_name: track, artist_name: artist })
  const exactRes = await fetch(`${LRCLIB_BASE}/get?${exactParams}`, {
    headers: HEADERS,
    cache: 'no-store',
  })

  if (exactRes.ok) {
    const data = await exactRes.json() as LrclibEntry
    const result = entryToResult(data)
    if (result) return result
  }

  // 2. Fuzzy search by track name only — handles cases where Spotify uses a romanised
  //    artist name (e.g. "atarayo") but lrclib stores the Japanese name (e.g. "あたらよ")
  const searchParams = new URLSearchParams({ q: track })
  const searchRes = await fetch(`${LRCLIB_BASE}/search?${searchParams}`, {
    headers: HEADERS,
    cache: 'no-store',
  })

  if (!searchRes.ok) return null

  const entries = await searchRes.json() as LrclibEntry[]
  if (!Array.isArray(entries) || entries.length === 0) return null

  // Prefer an exact track name match, then fall back to first result
  const trackLower = track.toLowerCase()
  const match =
    entries.find((e) => e.trackName.toLowerCase() === trackLower) ?? entries[0]

  return entryToResult(match)
}
