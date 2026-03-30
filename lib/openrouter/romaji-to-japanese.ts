import { openRouterChat } from './client'

/**
 * Converts romaji lyrics to native Japanese (kanji + kana).
 * Returns an array of converted lines matching the input length.
 */
export async function romajiToJapanese(lines: string[], apiKey: string): Promise<string[]> {
  const prompt = `You are a Japanese language expert. The following are romanized Japanese song lyrics. Convert each line to native Japanese script (kanji and kana). Preserve line breaks.

Romaji lyrics:
${lines.join('\n')}

Rules:
- Convert romaji → hiragana first (deterministic)
- Then apply natural kanji where appropriate using context
- Keep the same number of lines
- Return ONLY the converted Japanese lines, one per line, no numbering, no explanation`

  const content = await openRouterChat({
    apiKey,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  })

  const result = content.split('\n').map((l) => l.trim()).filter(Boolean)
  // Ensure same line count — pad with empty strings if needed
  while (result.length < lines.length) result.push('')
  return result.slice(0, lines.length)
}
