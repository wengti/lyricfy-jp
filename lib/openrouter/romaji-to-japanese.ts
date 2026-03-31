import { openRouterChat } from './client'

/**
 * Converts romaji lyrics to native Japanese (kanji + kana).
 * Returns an array of converted lines matching the input length exactly.
 */
export async function romajiToJapanese(lines: string[], apiKey: string): Promise<string[]> {
  const prompt = `You are a Japanese language expert. Convert each romanized Japanese lyric line to native Japanese script (kanji + kana). Return ONLY a JSON object — no intro, no explanation, no markdown.

JSON format:
{"lines":["...", "...", ...]}

Rules:
- "lines" MUST have exactly ${lines.length} entries — one per input line, in the same order
- Convert romaji → hiragana first, then apply natural kanji using song context
- Lines already in Japanese: keep as-is
- Lines in English or other non-romaji: keep as-is
- Output must start with { and end with }

Input lines (${lines.length} total):
${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`

  const content = await openRouterChat({
    apiKey,
    messages: [
      { role: 'system', content: 'You output only valid JSON. No prose, no markdown, no explanation.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    jsonMode: true,
  })

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON object found in romaji conversion response')
  const parsed = JSON.parse(jsonMatch[0]) as { lines: string[] }

  // Ensure exact line count — pad or trim to match input
  const result = Array.isArray(parsed.lines) ? parsed.lines.map(String) : []
  while (result.length < lines.length) result.push(lines[result.length])
  return result.slice(0, lines.length)
}
