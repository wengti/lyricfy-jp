import { openRouterChat } from './client'
import type { BreakdownWord } from '@/types/ai'

const SYSTEM_PROMPT = `You are a Japanese language tutor helping learners study vocabulary from song lyrics.

Given a Japanese phrase, extract the individual vocabulary words worth studying individually.

Rules:
1. Ignore standalone grammatical particles (を、が、は、に、で、と、も、へ、から、まで、より、や) — they carry no standalone meaning.
2. Convert verbs and adjectives to their plain dictionary form:
     食べましょうか → 食べる
     走っていた → 走る
     美しかった → 美しい
     来てください → 来る
3. Keep nouns, adverbs, and set expressions in their natural standalone form.
4. Skip common function words (です、ます、だ、である) when they appear on their own.
5. Aim for 2–6 words. Only include words genuinely useful for a learner — not every token.
6. For each word return:
     - word: the word in study form (kanji where natural)
     - hiragana: the hiragana reading
     - english_translation: a short, clear English meaning
     - example_japanese: a simple, natural sentence using the word
     - example_english: the English translation of that sentence
7. Respond with ONLY valid JSON — a single object with a "words" array.`

const FEW_SHOT_MESSAGES = [
  {
    role: 'user' as const,
    content: 'Phrase: ひるごはんを一緒にたべましょうか',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      words: [
        {
          word: '昼ご飯',
          hiragana: 'ひるごはん',
          english_translation: 'lunch',
          example_japanese: '昼ご飯を一緒に食べませんか？',
          example_english: 'Shall we have lunch together?',
        },
        {
          word: '一緒に',
          hiragana: 'いっしょに',
          english_translation: 'together',
          example_japanese: '一緒に行きましょう。',
          example_english: "Let's go together.",
        },
        {
          word: '食べる',
          hiragana: 'たべる',
          english_translation: 'to eat',
          example_japanese: '毎朝パンを食べる。',
          example_english: 'I eat bread every morning.',
        },
      ],
    }),
  },
  {
    role: 'user' as const,
    content: 'Phrase: 君のことが好きだから泣いてしまった',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      words: [
        {
          word: '君',
          hiragana: 'きみ',
          english_translation: 'you (casual/affectionate)',
          example_japanese: '君のことが大好きだよ。',
          example_english: 'I really love you.',
        },
        {
          word: '好き',
          hiragana: 'すき',
          english_translation: 'to like; fond of',
          example_japanese: '音楽が好きです。',
          example_english: 'I like music.',
        },
        {
          word: '泣く',
          hiragana: 'なく',
          english_translation: 'to cry',
          example_japanese: '映画を見て泣いた。',
          example_english: 'I cried watching the movie.',
        },
      ],
    }),
  },
  {
    role: 'user' as const,
    content: 'Phrase: 夜空に輝く星のように',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      words: [
        {
          word: '夜空',
          hiragana: 'よぞら',
          english_translation: 'night sky',
          example_japanese: '夜空の星がきれいだ。',
          example_english: 'The stars in the night sky are beautiful.',
        },
        {
          word: '輝く',
          hiragana: 'かがやく',
          english_translation: 'to shine; to sparkle',
          example_japanese: '太陽が輝いている。',
          example_english: 'The sun is shining.',
        },
        {
          word: '星',
          hiragana: 'ほし',
          english_translation: 'star',
          example_japanese: '夜になると星が見える。',
          example_english: 'Stars can be seen at night.',
        },
      ],
    }),
  },
]

export async function breakdownPhrase(phrase: string, apiKey: string): Promise<BreakdownWord[]> {
  const content = await openRouterChat({
    apiKey,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...FEW_SHOT_MESSAGES,
      { role: 'user', content: `Phrase: ${phrase}` },
    ],
    temperature: 0.1,
    jsonMode: true,
  })

  const parsed = JSON.parse(content) as { words: BreakdownWord[] }
  if (!Array.isArray(parsed.words)) throw new Error('Unexpected AI response format')
  return parsed.words
}
