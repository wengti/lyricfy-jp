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
  force: z.boolean().optional(), // bypass cache and overwrite with fresh result
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { lines, track, artist, force } = parsed.data

  // Force-overwrite is an admin-only action
  if (force) {
    try {
      await requireAdmin()
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 403 })
    }
  }

  // Check Supabase cache first (skipped when force=true) — no API key needed
  if (!force && track && artist) {
    const cached = await getCachedTranslation(track, artist, lines)
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
      batches.map((batch) => generateFuriganaAndTranslations(batch, apiKey))
    )
    const all = results.flat()

    // Store in cache for future requests
    if (track && artist) {
      await setCachedTranslation(track, artist, all, lines)
    }

    return NextResponse.json({ lines: all })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
