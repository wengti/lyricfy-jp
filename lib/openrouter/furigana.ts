import { openRouterChat } from './client'
import { hasJapaneseChars } from '@/lib/utils/japanese'
import type { FuriganaToken, TranslatedLine } from '@/types/ai'

interface FuriganaResponse {
  furigana: Array<Array<{ original: string; reading: string | null }>>
  translations: string[]
}

/**
 * Sends up to 15 lines to OpenRouter and returns furigana tokens + translations.
 * Pure non-Japanese lines are resolved locally without hitting the model.
 */
export async function generateFuriganaAndTranslations(
  lines: string[],
  apiKey: string
): Promise<TranslatedLine[]> {
  // Split lines into Japanese (needs model) vs plain English/empty (resolved locally)
  const japaneseIndices: number[] = []
  const japaneseLines: string[] = []

  lines.forEach((line, i) => {
    if (hasJapaneseChars(line)) {
      japaneseIndices.push(i)
      japaneseLines.push(line)
    }
  })

  // Pre-fill results: non-Japanese lines get empty tokens and the original text as translation
  const results: TranslatedLine[] = lines.map((line) => ({
    tokens: [] as FuriganaToken[],
    translation: line,
  }))

  if (japaneseLines.length === 0) return results

  const prompt = `You are a Japanese language expert. Return ONLY a JSON object — no intro, no explanation, no markdown.

JSON format:
{"furigana":[[{"original":"...","reading":"..."},...],...],"translations":["...",...]}

Rules:
- Every line below contains Japanese. Tokenize the ENTIRE line:
  - Japanese tokens (kanji/kana): set "reading" to the hiragana reading, or null if already hiragana/katakana
  - Non-Japanese tokens (English words, numbers, punctuation): set "reading" to null
- "translations": one natural English translation per line
- NEVER skip a line — both arrays must have exactly ${japaneseLines.length} entries
- Output must start with { and end with }

Lines (${japaneseLines.length} total):
${japaneseLines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`

  const content = await openRouterChat({
    apiKey,
    messages: [
      { role: 'system', content: 'You output only valid JSON. No prose, no markdown, no explanation.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    maxTokens: 8192,
    jsonMode: true,
  })

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON object found in model response. Got: "${content.slice(0, 300)}"`)

  const parsed = JSON.parse(jsonMatch[0]) as FuriganaResponse

  // Merge model results back into their original positions
  japaneseIndices.forEach((originalIndex, batchIndex) => {
    const raw = parsed.furigana[batchIndex] ?? []
    const tokens: FuriganaToken[] = raw.map((t) => ({
      original: t.original,
      reading: t.reading ?? null,
    }))

    // Verify the tokens faithfully reconstruct the original line.
    // Compare only Japanese characters (kana + kanji) — this ignores punctuation
    // differences where the model substitutes Japanese marks (、。！？) with ASCII
    // equivalents (, . ! ?) in its JSON output, which would otherwise cause every
    // line with punctuation to fail and lose all furigana.
    const japaneseOnly = (s: string) =>
      s.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g, '')
    const reconstructed = japaneseOnly(tokens.map((t) => t.original).join(''))
    const validTokens = reconstructed === japaneseOnly(japaneseLines[batchIndex]) ? tokens : []

    results[originalIndex] = {
      tokens: validTokens,
      translation: parsed.translations[batchIndex] ?? '',
    }
  })

  return results
}
