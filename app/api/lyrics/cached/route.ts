import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LrcLine, TranslatedLine } from '@/types/ai'

interface CacheEntry {
  linesHash: string
  lines: TranslatedLine[]
  source?: 'manual' | 'lrclib' | 'lrclib-romaji'
  timestamps?: number[]
  synced?: boolean
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const track = searchParams.get('track')?.toLowerCase().trim()
  const artist = searchParams.get('artist')?.toLowerCase().trim()

  if (!track || !artist) {
    return NextResponse.json({ error: 'track and artist are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('lyrics_cache')
    .select('translated_lines')
    .eq('track_name', track)
    .eq('artist', artist)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const raw = data.translated_lines as CacheEntry | TranslatedLine[]

  let translatedLines: TranslatedLine[]
  let timestamps: number[] | undefined
  let source: string | null
  let synced: boolean

  if (Array.isArray(raw)) {
    // Legacy plain-array format (no CacheEntry wrapper)
    translatedLines = raw
    timestamps = undefined
    source = null
    synced = false
  } else {
    translatedLines = raw.lines ?? []
    timestamps = raw.timestamps
    source = raw.source ?? null
    synced = raw.synced ?? false
  }

  const lines: LrcLine[] = translatedLines
    .map((line, i) => ({
      ms: timestamps?.[i] ?? 0,
      text: line.tokens.length > 0
        ? line.tokens.map((t) => t.original).join('')
        : line.translation,
    }))
    .filter((l) => l.text.trim())

  return NextResponse.json({ lines, translatedLines, source, synced })
}
