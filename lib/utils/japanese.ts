const KANJI_RANGE = /[\u4E00-\u9FFF]/
const HIRAGANA_RANGE = /[\u3040-\u309F]/
const KATAKANA_RANGE = /[\u30A0-\u30FF]/

export function hasJapaneseChars(text: string): boolean {
  return KANJI_RANGE.test(text) || HIRAGANA_RANGE.test(text) || KATAKANA_RANGE.test(text)
}

/** Returns true if text is romaji: all ASCII, no Japanese characters */
export function isRomaji(text: string): boolean {
  if (hasJapaneseChars(text)) return false
  // Check if there's significant Latin text (ignore punctuation/numbers only)
  return /[a-zA-Z]/.test(text)
}

/** Check all lines collectively */
export function detectScript(lines: string[]): 'japanese' | 'romaji' | 'other' {
  const combined = lines.join(' ')
  if (hasJapaneseChars(combined)) return 'japanese'
  if (isRomaji(combined)) return 'romaji'
  return 'other'
}
