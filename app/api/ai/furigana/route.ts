import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/getUserApiKeys'
import { generateFuriganaAndTranslations } from '@/lib/openrouter/furigana'
import { getCachedTranslation, setCachedTranslation } from '@/lib/lyricsCache'
import { z } from 'zod'

const BATCH_SIZE = 25

const schema = z.object({
  lines: z.array(z.string()).min(1),
  track: z.string().optional(),
  artist: z.string().optional(),
})

export async function POST(request: Request) {
  let apiKey: string
  try {
    apiKey = await requireApiKey('openrouter_api_key', 'OpenRouter API Key')
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { lines, track, artist } = parsed.data

  // Check Supabase cache first
  if (track && artist) {
    const cached = await getCachedTranslation(track, artist)
    if (cached) {
      return NextResponse.json({ lines: cached })
    }
  }

  // Process in batches of 25 server-side
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
      await setCachedTranslation(track, artist, all)
    }

    return NextResponse.json({ lines: all })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
