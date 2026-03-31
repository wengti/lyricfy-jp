import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TranslatedLine } from '@/types/ai'

function normalise(s: string) {
  return s.toLowerCase().trim()
}

function hashLines(lines: string[]): string {
  return createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16)
}

interface CacheEntry {
  linesHash: string
  lines: TranslatedLine[]
}

export async function getCachedTranslation(
  track: string,
  artist: string,
  sourceLines: string[]
): Promise<TranslatedLine[] | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('lyrics_cache')
    .select('translated_lines')
    .eq('track_name', normalise(track))
    .eq('artist', normalise(artist))
    .maybeSingle()

  if (!data) return null

  const entry = data.translated_lines as CacheEntry | TranslatedLine[]

  // Legacy format (plain array without hash) — return as-is rather than
  // discarding it and forcing a re-translation.
  if (Array.isArray(entry)) return entry as TranslatedLine[]

  // Validate that the cache was built from the same source lines.
  // A mismatch means the cache holds a manual replacement (or vice versa).
  if (entry.linesHash !== hashLines(sourceLines)) return null

  return entry.lines ?? null
}

export async function setCachedTranslation(
  track: string,
  artist: string,
  lines: TranslatedLine[],
  sourceLines: string[]
): Promise<void> {
  const supabase = createAdminClient()
  const entry: CacheEntry = {
    linesHash: hashLines(sourceLines),
    lines,
  }
  await supabase.from('lyrics_cache').upsert(
    {
      track_name: normalise(track),
      artist: normalise(artist),
      translated_lines: entry,
    },
    { onConflict: 'track_name,artist' }
  )
}
