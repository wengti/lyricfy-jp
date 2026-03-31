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
  source?: 'manual' | 'lrclib' | 'lrclib-romaji'
  timestamps?: number[] // ms timestamps from the original synced LRC, only stored for manual entries
  synced?: boolean      // whether the original lyrics had LRC timestamps
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
 * Returns reconstructed LrcLines only when the cache entry was written from
 * manually-pasted/re-translated lyrics (source === 'manual', or legacy entries
 * without a source tag which were also created from manual pastes).
 * Returns null for lrclib-sourced cache entries or when no entry exists.
 * Used by the lyrics route to bypass lrclib when the admin has already
 * provided correct lyrics for this track.
 */
export async function getManualCachedLines(
  track: string,
  artist: string
): Promise<{ lines: LrcLine[]; synced: boolean; wasRomaji: boolean } | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('lyrics_cache')
    .select('translated_lines')
    .eq('track_name', normalise(track))
    .eq('artist', normalise(artist))
    .maybeSingle()

  if (!data) return null

  const entry = data.translated_lines as CacheEntry | TranslatedLine[]

  // Legacy format (plain array, no source) — treat as manual (created before source tracking)
  if (Array.isArray(entry)) {
    const lines = reconstructLines(entry as TranslatedLine[])
    return lines ? { lines, synced: false, wasRomaji: false } : null
  }

  // Only return lines if explicitly manual; lrclib-sourced entries should defer to lrclib
  if (entry.source === 'lrclib') return null

  const lines = reconstructLines(entry.lines ?? [], entry.timestamps)
  return lines ? { lines, synced: entry.synced ?? false, wasRomaji: entry.source === 'lrclib-romaji' } : null
}

function reconstructLines(cached: TranslatedLine[], timestamps?: number[]): LrcLine[] | null {
  const lines = cached
    .map((line, i) => ({
      ms: timestamps?.[i] ?? 0,
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
  sourceLines: string[],
  source: 'manual' | 'lrclib' | 'lrclib-romaji' = 'lrclib',
  timestamps?: number[],
  synced?: boolean
): Promise<void> {
  const supabase = createAdminClient()
  const entry: CacheEntry = {
    linesHash: hashLines(sourceLines),
    lines,
    source,
    ...(timestamps ? { timestamps } : {}),
    ...(synced !== undefined ? { synced } : {}),
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
