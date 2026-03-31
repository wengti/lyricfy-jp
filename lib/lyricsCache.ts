import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LrcLine, TranslatedLine } from '@/types/ai'

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
  artist: string
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

  // Legacy format (plain array without hash) — return as-is.
  if (Array.isArray(entry)) return entry as TranslatedLine[]

  return entry.lines ?? null
}

/**
 * Reconstructs raw LrcLines from a cached translation entry.
 * Used when lrclib has no lyrics for a song but an admin previously
 * pasted and translated them — the stored tokens carry the original text.
 * Returns null if no cache entry exists for this track/artist.
 */
export async function reconstructLinesFromCache(
  track: string,
  artist: string
): Promise<LrcLine[] | null> {
  const cached = await getCachedTranslation(track, artist)
  if (!cached) return null

  const lines = cached
    .map((line) => ({
      ms: 0,
      // Japanese lines: rebuild from tokens. Non-Japanese (empty tokens): use translation text.
      text: line.tokens.length > 0
        ? line.tokens.map((t) => t.original).join('')
        : line.translation,
    }))
    .filter((l) => l.text.trim())

  return lines.length > 0 ? lines : null
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
