import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/getUserApiKeys'
import { generateFuriganaAndTranslations } from '@/lib/openrouter/furigana'
import { z } from 'zod'

const schema = z.object({ text: z.string().min(1).max(500) })

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

  try {
    const results = await generateFuriganaAndTranslations([parsed.data.text], apiKey)
    return NextResponse.json({ furigana: results[0]?.tokens ?? [] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
