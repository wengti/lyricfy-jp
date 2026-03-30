/** One token in a furigana-annotated line */
export interface FuriganaToken {
  original: string       // The original text (kanji or kana)
  reading: string | null // Hiragana reading, null if no annotation needed
}

/** A single lyrics line with furigana tokens and its English translation */
export interface TranslatedLine {
  tokens: FuriganaToken[]
  translation: string
}

/** Enrichment data returned by the AI for a vocabulary word */
export interface EnrichedWord {
  hiragana: string
  english_translation: string
  example_japanese: string
  example_english: string
}

/** A single line from an LRC file */
export interface LrcLine {
  ms: number   // Timestamp in milliseconds (0 for unsynced lyrics)
  text: string // The lyrics text for this line
}

/** Result returned by the unified /api/lyrics route */
export interface LyricsResult {
  lines: LrcLine[]
  synced: boolean    // true = has LRC timestamps from lrclib
  notFound: boolean  // true = both lrclib and Genius failed
  isJapanese: boolean
  wasRomaji: boolean // true = lyrics were romaji, converted by AI
  source: 'lrclib' | 'genius' | 'manual' | null
}
