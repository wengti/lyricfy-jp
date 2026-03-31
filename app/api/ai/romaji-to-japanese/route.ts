import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/getUserApiKeys'
import { requireAdmin } from '@/lib/requireAdmin'
import { romajiToJapanese } from '@/lib/openrouter/romaji-to-japanese'
import { z } from 'zod'

const schema = z.object({
  lines: z.array(z.string()).min(1).max(200),
})

export async function POST(request: Request) {
  try {
    await requireAdmin()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 })
  }

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
    const lines = await romajiToJapanese(parsed.data.lines, apiKey)
    return NextResponse.json({ lines })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
