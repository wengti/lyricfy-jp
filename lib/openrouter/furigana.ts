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
  const prompt = `You are a Japanese language expert. Given the following Japanese lyrics lines, return a JSON object with:
- "furigana": array of arrays, one per line. Each inner array contains objects {"original": "kanji or kana", "reading": "hiragana reading or null if no annotation needed"}
- "translations": array of English translations, one per line (natural, not literal)

Lines:
${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}

Rules:
- For pure hiragana/katakana tokens, set reading to null
- For kanji or mixed kanji+kana, provide the hiragana reading
- Keep translations concise and natural
- Return ONLY valid JSON, no explanation`

  const content = await openRouterChat({
    apiKey,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  })

  const parsed = JSON.parse(content) as FuriganaResponse

  return lines.map((_, i) => ({
    tokens: (parsed.furigana[i] ?? []).map((t) => ({
      original: t.original,
      reading: t.reading ?? null,
    })) as FuriganaToken[],
    translation: parsed.translations[i] ?? '',
  }))
}
