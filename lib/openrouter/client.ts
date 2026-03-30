const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const MODEL = 'google/gemma-3-27b-it:free'

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface OpenRouterOptions {
  apiKey: string
  messages: OpenRouterMessage[]
  temperature?: number
  jsonMode?: boolean
}

/**
 * Base fetch wrapper for OpenRouter chat completions.
 * Strips markdown fences from the response before returning.
 */
export async function openRouterChat(options: OpenRouterOptions): Promise<string> {
  const { apiKey, messages, temperature = 0.3, jsonMode = false } = options

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature,
  }
  if (jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'LyricfyJP',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  const data = await res.json()
  let content: string = data.choices?.[0]?.message?.content ?? ''

  // Strip markdown code fences if the model wrapped its JSON response
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  return content
}
