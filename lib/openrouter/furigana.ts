import { openRouterChat } from './client'
import type { FuriganaToken, TranslatedLine } from '@/types/ai'

interface FuriganaResponse {
  furigana: Array<Array<{ original: string; reading: string | null }>>
  translations: string[]
}

/**
 * Sends up to 25 lines to OpenRouter and returns furigana tokens + translations.
 * Combined in one call to halve API usage.
 */
export async function generateFuriganaAndTranslations(
  lines: string[],
  apiKey: string
): Promise<TranslatedLine[]> {
  const prompt = `You are a Japanese language expert. Return ONLY a JSON object — no intro, no explanation, no markdown.

JSON format:
{"furigana":[[{"original":"...","reading":"..."},...],...],"translations":["...",...]}

Rules:
- "furigana": one inner array per line; each object has "original" (the token) and "reading" (hiragana, or null for pure kana)
- "translations": one natural English translation per line
- Output must start with { and end with }

Lines:
${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`

  const content = await openRouterChat({
    apiKey,
    messages: [
      { role: 'system', content: 'You output only valid JSON. No prose, no markdown, no explanation.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
  })

  // Extract the JSON object even if the model adds surrounding text
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON object found in model response')
  const parsed = JSON.parse(jsonMatch[0]) as FuriganaResponse

  return lines.map((_, i) => ({
    tokens: (parsed.furigana[i] ?? []).map((t) => ({
      original: t.original,
      reading: t.reading ?? null,
    })) as FuriganaToken[],
    translation: parsed.translations[i] ?? '',
  }))
}
