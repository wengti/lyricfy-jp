import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLyricsFromLrclib } from '@/lib/lrclib/client'
import { searchGenius, scrapeGeniusLyrics } from '@/lib/genius/scraper'
import { getUserApiKeys } from '@/lib/getUserApiKeys'
import { detectScript } from '@/lib/utils/japanese'
import type { LyricsResult } from '@/types/ai'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const track = searchParams.get('track')?.trim()
  const artist = searchParams.get('artist')?.trim()

  if (!track || !artist) {
    return NextResponse.json({ error: 'track and artist are required' }, { status: 400 })
  }

  // 1. Try lrclib.net (free, no key required)
  let result = await getLyricsFromLrclib(track, artist)

  // 2. Genius fallback
  if (!result) {
    const keys = await getUserApiKeys()
    if (keys?.genius_access_token) {
      const song = await searchGenius(track, artist, keys.genius_access_token)
      if (song?.url) {
        const lines = await scrapeGeniusLyrics(song.url)
        if (lines && lines.length > 0) {
          result = { lines, synced: false }
        }
      }
    }
  }

  // 3. Not found
  if (!result) {
    const response: LyricsResult = {
      lines: [],
      synced: false,
      notFound: true,
      isJapanese: false,
      wasRomaji: false,
    }
    return NextResponse.json(response)
  }

  // Detect script
  const rawTexts = result.lines.map((l) => l.text)
  const script = detectScript(rawTexts)

  const response: LyricsResult = {
    lines: result.lines,
    synced: result.synced,
    notFound: false,
    isJapanese: script === 'japanese',
    wasRomaji: false,
  }

  return NextResponse.json(response)
}
