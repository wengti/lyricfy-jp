import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/getUserApiKeys'
import { breakdownPhrase } from '@/lib/openrouter/breakdown-phrase'
import { z } from 'zod'

const schema = z.object({ phrase: z.string().min(1).max(500) })

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
    const words = await breakdownPhrase(parsed.data.phrase, apiKey)
    return NextResponse.json({ words })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
