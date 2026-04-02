import { openRouterChat } from './client'
import { hasJapaneseChars } from '@/lib/utils/japanese'
import type { FuriganaToken, TranslatedLine } from '@/types/ai'

interface FuriganaResponse {
  furigana: Array<Array<{ original: string; reading: string | null }>>
  translations: string[]
}

const japaneseOnly = (s: string) =>
  s.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g, '')

async function callFuriganaModel(
  lines: string[],
  apiKey: string,
  strict: boolean
): Promise<FuriganaResponse> {
  const rules = strict
    ? `Rules — follow exactly:
- Tokenize every character in every line, leaving nothing out.
- Every kanji MUST have a hiragana reading. Examples:
    {"original":"考","reading":"かんが"}, {"original":"頭","reading":"あたま"}, {"original":"痛","reading":"いた"}
- Hiragana and katakana tokens do NOT need a reading: {"original":"えすぎて","reading":null}
- Non-Japanese tokens (punctuation, numbers, Latin letters): {"reading":null}
- "translations": one natural English sentence per line — must be written in English, never Japanese`
    : `Rules:
- Every line below contains Japanese. Tokenize the ENTIRE line:
  - Kanji tokens: set "reading" to the hiragana reading
  - Hiragana/katakana tokens: set "reading" to null (no annotation needed)
  - Non-Japanese tokens (English words, numbers, punctuation): set "reading" to null
- "translations": one natural English translation per line`

  const prompt = `You are a Japanese language expert. Return ONLY a JSON object — no intro, no explanation, no markdown.

JSON format:
{"furigana":[[{"original":"...","reading":"..."},...],...],"translations":["...",...]}

${rules}
- NEVER skip a line — both arrays must have exactly ${lines.length} entries
- CRITICAL: tokens may span multiple characters (e.g. compound words like 時間 as one token), but every character in "original" must be copied verbatim from the source text — do NOT convert hiragana to kanji or alter any character.
- Output must start with { and end with }

Lines (${lines.length} total):
${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`

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

  return JSON.parse(jsonMatch[0]) as FuriganaResponse
}

/**
 * Sends up to 15 lines to OpenRouter and returns furigana tokens + translations.
 * Pure non-Japanese lines are resolved locally without hitting the model.
 * When strict=true (re-translate), uses a tighter prompt and retries lines that
 * fail token validation up to 2 additional times.
 */
export async function generateFuriganaAndTranslations(
  lines: string[],
  apiKey: string,
  strict = false
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

  // Indices into japaneseLines that still need valid tokens
  let unresolved = japaneseLines.map((_, i) => i)

  const maxAttempts = strict ? 3 : 1

  for (let attempt = 0; attempt < maxAttempts && unresolved.length > 0; attempt++) {
    const batchLines = unresolved.map((i) => japaneseLines[i])
    const useStrict = strict || attempt > 0

    let parsed: FuriganaResponse
    try {
      parsed = await callFuriganaModel(batchLines, apiKey, useStrict)
    } catch {
      break // AI call failed — leave unresolved lines with empty tokens
    }

    const stillUnresolved: number[] = []

    unresolved.forEach((japIdx, responseIdx) => {
      const originalIdx = japaneseIndices[japIdx]
      const raw = parsed.furigana[responseIdx] ?? []
      const tokens: FuriganaToken[] = raw.map((t) => ({
        original: t.original,
        // Defensively normalise: the model sometimes returns the string "null"
        // instead of JSON null. Treat any falsy or literal-"null" reading as null.
        reading: t.reading && t.reading !== 'null' ? t.reading : null,
      }))

      // Verify the tokens faithfully reconstruct the original line.
      // Compare only Japanese characters — ignores punctuation substitution differences.
      const reconstructed = japaneseOnly(tokens.map((t) => t.original).join(''))
      const validTokens = reconstructed === japaneseOnly(japaneseLines[japIdx]) ? tokens : []

      if (validTokens.length > 0) {
        results[originalIdx] = {
          tokens: validTokens,
          translation: parsed.translations[responseIdx] ?? '',
        }
      } else {
        stillUnresolved.push(japIdx)
      }
    })

    unresolved = stillUnresolved
  }

  return results
}
