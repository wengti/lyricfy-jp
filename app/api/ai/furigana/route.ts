import { NextResponse } from 'next/server'

export const maxDuration = 120 // seconds — AI calls can be slow for long songs
import { requireApiKey } from '@/lib/getUserApiKeys'
import { requireAdmin } from '@/lib/requireAdmin'
import { generateFuriganaAndTranslations } from '@/lib/openrouter/furigana'
import { getCachedTranslation, setCachedTranslation } from '@/lib/lyricsCache'
import { z } from 'zod'

const BATCH_SIZE = 15

const schema = z.object({
  lines: z.array(z.string()).min(1),
  track: z.string().optional(),
  artist: z.string().optional(),
  force: z.boolean().optional(),          // bypass cache and overwrite with fresh result
  wasRomaji: z.boolean().optional(),       // lyrics were romaji-converted — save as 'manual' to persist
  syncedUpgrade: z.boolean().optional(),  // admin accepting a newly-synced lrclib version
  timestamps: z.array(z.number()).optional(), // ms timestamps from the original synced LRC
  synced: z.boolean().optional(),             // whether the original lyrics were synced
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { lines, track, artist, force, wasRomaji, syncedUpgrade, timestamps, synced } = parsed.data

  // Force-overwrite and synced-upgrade are admin-only actions
  if (force || syncedUpgrade) {
    try {
      await requireAdmin()
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 403 })
    }
  }

  // Check Supabase cache first (skipped when force or syncedUpgrade) — no API key needed
  if (!force && !syncedUpgrade && track && artist) {
    const cached = await getCachedTranslation(track, artist)
    if (cached) {
      return NextResponse.json({ lines: cached })
    }
  }

  // Cache miss — need the user's API key to call the AI
  let apiKey: string
  try {
    apiKey = await requireApiKey('openrouter_api_key', 'OpenRouter API Key')
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 })
  }

  // Process batches in parallel — faster for songs with multiple batches
  try {
    const batches: string[][] = []
    for (let i = 0; i < lines.length; i += BATCH_SIZE) {
      batches.push(lines.slice(i, i + BATCH_SIZE))
    }
    const results = await Promise.all(
      batches.map((batch) => generateFuriganaAndTranslations(batch, apiKey, force))
    )
    const all = results.flat()

    // Only cache when at least one line has furigana tokens — guards against
    // saving empty results for non-Japanese content or stale/mismatched lines.
    if (track && artist && all.some((l) => l.tokens.length > 0)) {
      const saveSource = syncedUpgrade ? 'lrclib' : (force && wasRomaji) ? 'manual-romaji' : wasRomaji ? 'lrclib-romaji' : force ? 'manual' : 'lrclib'
      await setCachedTranslation(
        track, artist, all, lines,
        saveSource,
        (wasRomaji || force || syncedUpgrade) ? timestamps : undefined,
        synced,
      )
    }

    return NextResponse.json({ lines: all })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
