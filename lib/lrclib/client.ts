import { toHiragana, isRomaji } from 'wanakana'
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

/** Score a search result by how well it matches the target track and artist. */
function scoreEntry(entry: LrclibEntry, track: string, artist: string, hiraganaArtist: string): number {
  const t = entry.trackName.toLowerCase()
  const a = entry.artistName.toLowerCase()
  const trackQ = track.toLowerCase()
  const artistQ = artist.toLowerCase()

  let score = 0

  // Track name match
  if (t === trackQ) score += 10
  else if (t.includes(trackQ)) score += 4

  // Artist match — check original, hiragana conversion, and substring forms
  if (a === artistQ) score += 10
  else if (a === hiraganaArtist) score += 10
  else if (a.includes(artistQ) || artistQ.includes(a)) score += 4
  else if (hiraganaArtist && (a.includes(hiraganaArtist) || hiraganaArtist.includes(a))) score += 4

  return score
}

function pickBest(entries: LrclibEntry[], track: string, artist: string, hiraganaArtist: string): LrclibEntry | null {
  if (!entries.length) return null
  return entries.reduce((best, e) => {
    const scoreE = scoreEntry(e, track, artist, hiraganaArtist)
    const scoreBest = scoreEntry(best, track, artist, hiraganaArtist)
    if (scoreE > scoreBest) return e
    if (scoreE === scoreBest && e.syncedLyrics && !best.syncedLyrics) return e
    return best
  })
}

/** Find the highest-scoring entry that has synced lyrics, if any. */
function pickBestSynced(entries: LrclibEntry[], track: string, artist: string, hiraganaArtist: string): LrclibEntry | null {
  const synced = entries.filter(e => e.syncedLyrics)
  if (!synced.length) return null
  return synced.reduce((best, e) =>
    scoreEntry(e, track, artist, hiraganaArtist) >= scoreEntry(best, track, artist, hiraganaArtist) ? e : best
  )
}

async function searchLrclib(q: string): Promise<LrclibEntry[]> {
  const res = await fetch(`${LRCLIB_BASE}/search?${new URLSearchParams({ q })}`, {
    headers: HEADERS,
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function getLyricsFromLrclib(
  track: string,
  artist: string
): Promise<LrclibResult | null> {
  // Convert romaji artist name to hiragana for Japanese databases
  // e.g. "natori" → "なとり", "atarayo" → "あたらよ"
  const hiraganaArtist = isRomaji(artist) ? toHiragana(artist).toLowerCase() : ''

  let unsyncedFallback: LrclibResult | null = null

  // 1. Exact match — fastest, works when Spotify name matches lrclib exactly
  const exactParams = new URLSearchParams({ track_name: track, artist_name: artist })
  const exactRes = await fetch(`${LRCLIB_BASE}/get?${exactParams}`, {
    headers: HEADERS,
    cache: 'no-store',
  })
  if (exactRes.ok) {
    const data = await exactRes.json() as LrclibEntry
    const result = entryToResult(data)
    if (result?.synced) return result
    if (result) unsyncedFallback = result
  }

  // 2. Combined search: "track artist" — lets lrclib match both fields at once.
  //    Try with hiragana artist first (e.g. "セレナーデ なとり"), then romaji fallback.
  //    Continue even after an unsynced exact match to find a synced version.
  const combinedQueries = hiraganaArtist
    ? [`${track} ${hiraganaArtist}`, `${track} ${artist}`]
    : [`${track} ${artist}`]

  for (const q of combinedQueries) {
    const entries = await searchLrclib(q)
    if (entries.length) {
      const bestSynced = pickBestSynced(entries, track, artist, hiraganaArtist)
      if (bestSynced && scoreEntry(bestSynced, track, artist, hiraganaArtist) > 0) {
        const result = entryToResult(bestSynced)
        if (result?.synced) return result
      }
      const best = pickBest(entries, track, artist, hiraganaArtist)
      if (best) {
        const result = entryToResult(best)
        if (result && !unsyncedFallback) unsyncedFallback = result
      }
    }
  }

  // 3. Track-only fuzzy search — broadest net, scored by artist similarity
  const entries = await searchLrclib(track)
  if (entries.length) {
    const bestSynced = pickBestSynced(entries, track, artist, hiraganaArtist)
    if (bestSynced && scoreEntry(bestSynced, track, artist, hiraganaArtist) > 0) {
      const result = entryToResult(bestSynced)
      if (result?.synced) return result
    }
    const best = pickBest(entries, track, artist, hiraganaArtist)
    if (best) {
      const result = entryToResult(best)
      if (result && !unsyncedFallback) unsyncedFallback = result
    }
  }

  return unsyncedFallback
}
