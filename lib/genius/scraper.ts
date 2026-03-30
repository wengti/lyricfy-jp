import { parseGeniusHtml } from '@/lib/utils/lyrics-parser'
import { plainLinesToLrc } from '@/lib/utils/lrc-parser'
import type { LrcLine } from '@/types/ai'

const GENIUS_API = 'https://api.genius.com'

interface GeniusSong {
  url: string
  title: string
  primary_artist: { name: string }
}

export async function searchGenius(
  track: string,
  artist: string,
  accessToken: string
): Promise<GeniusSong | null> {
  const query = `${track} ${artist}`
  const res = await fetch(
    `${GENIUS_API}/search?q=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }
  )
  if (!res.ok) return null

  const data = await res.json()
  const hits = data.response?.hits ?? []

  // Find the best match — prefer title/artist similarity
  const trackLower = track.toLowerCase()
  const artistLower = artist.toLowerCase()

  const best = hits.find((h: { type: string; result: GeniusSong }) => {
    if (h.type !== 'song') return false
    const t = h.result.title.toLowerCase()
    const a = h.result.primary_artist.name.toLowerCase()
    return t.includes(trackLower) || a.includes(artistLower)
  })

  return best?.result ?? (hits[0]?.result ?? null)
}

export async function scrapeGeniusLyrics(songUrl: string): Promise<LrcLine[] | null> {
  const res = await fetch(songUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    },
    cache: 'no-store',
  })
  if (!res.ok) return null

  const html = await res.text()
  const lines = parseGeniusHtml(html)
  if (lines.length === 0) return null

  return plainLinesToLrc(lines)
}
