import { createAdminClient } from '@/lib/supabase/admin'
import type { TranslatedLine } from '@/types/ai'

function normalise(s: string) {
  return s.toLowerCase().trim()
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
  return (data?.translated_lines as TranslatedLine[]) ?? null
}

export async function setCachedTranslation(
  track: string,
  artist: string,
  lines: TranslatedLine[]
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('lyrics_cache').upsert(
    {
      track_name: normalise(track),
      artist: normalise(artist),
      translated_lines: lines,
    },
    { onConflict: 'track_name,artist' }
  )
}
