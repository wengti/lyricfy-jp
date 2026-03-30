const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const MODEL = 'meta-llama/llama-3.1-8b-instruct'

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface OpenRouterOptions {
  apiKey: string
  messages: OpenRouterMessage[]
  temperature?: number
}

const RETRY_DELAYS_MS = [2000, 5000, 10000]

/**
 * Base fetch wrapper for OpenRouter chat completions.
 * Strips markdown fences from the response before returning.
 * Retries automatically on 429 rate-limit responses.
 */
export async function openRouterChat(options: OpenRouterOptions): Promise<string> {
  const { apiKey, messages, temperature = 0.3 } = options

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature,
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'X-Title': 'LyricfyJP',
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)

    let res: Response
    try {
      res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (e) {
      clearTimeout(timeout)
      // Timeout — retry with backoff rather than failing immediately
      if (e instanceof Error && e.name === 'AbortError') {
        lastError = new Error('OpenRouter request timed out')
        if (attempt < RETRY_DELAYS_MS.length) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]))
          continue
        }
        break
      }
      throw new Error(String(e))
    }
    clearTimeout(timeout)

    if (res.status === 429) {
      const text = await res.text()
      // Daily quota exhausted — retrying won't help
      if (text.includes('per-day') || text.includes('per_day')) {
        throw new Error('You have reached the daily free model limit on OpenRouter. Add credits at openrouter.ai/settings to continue.')
      }
      // Temporary upstream throttle — retry with backoff
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]))
        continue
      }
      lastError = new Error(`OpenRouter error 429: ${text}`)
      break
    }

    if (!res.ok) {
      const text = await res.text()
      lastError = new Error(`OpenRouter error ${res.status}: ${text}`)
      break
    }

    const data = await res.json()
    let content: string = data.choices?.[0]?.message?.content ?? ''
    content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    return content
  }

  throw lastError ?? new Error('OpenRouter request failed after retries')
}
