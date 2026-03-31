import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLyricsFromLrclib } from '@/lib/lrclib/client'
import { getManualCachedLines } from '@/lib/lyricsCache'
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

  // Check Supabase for manually-pasted/re-translated lyrics first.
  // This bypasses lrclib entirely so admin corrections aren't overridden by
  // lrclib's (potentially longer/different) line set, which would cause
  // untranslated lines to appear at the end of the song for non-admin users.
  const manualResult = await getManualCachedLines(track, artist)
  if (manualResult) {
    const response: LyricsResult = {
      lines: manualResult.lines,
      synced: manualResult.synced,
      notFound: false,
      isJapanese: true,
      wasRomaji: false,
      source: 'manual',
    }
    return NextResponse.json(response)
  }

  // Try lrclib.net (free, no key required)
  const result = await getLyricsFromLrclib(track, artist)
  const source: LyricsResult['source'] = result ? 'lrclib' : null

  if (!result) {
    const response: LyricsResult = {
      lines: [],
      synced: false,
      notFound: true,
      isJapanese: false,
      wasRomaji: false,
      source: null,
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
    source,
  }

  return NextResponse.json(response)
}
