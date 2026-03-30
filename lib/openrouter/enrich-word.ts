import { openRouterChat } from './client'
import type { EnrichedWord } from '@/types/ai'

export async function enrichWord(word: string, apiKey: string): Promise<EnrichedWord> {
  const prompt = `You are a Japanese language expert. Given the Japanese word or phrase below, return a JSON object with exactly these fields:
- "hiragana": the hiragana reading
- "english_translation": a concise English definition
- "example_japanese": a natural example sentence in Japanese using this word
- "example_english": the English translation of that example sentence

Word: ${word}

Respond with ONLY valid JSON, no explanation.`

  const content = await openRouterChat({
    apiKey,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    jsonMode: true,
  })

  const parsed = JSON.parse(content) as EnrichedWord
  return parsed
}
