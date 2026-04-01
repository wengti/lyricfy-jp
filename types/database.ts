import type { FuriganaToken } from '@/types/ai'

export interface DictionaryEntry {
  id: string
  user_id: string
  japanese_text: string
  hiragana: string
  english_translation: string
  example_japanese: string | null
  example_furigana: FuriganaToken[] | null
  example_english: string | null
  source_song: string | null
  source_artist: string | null
  source_lyrics_line: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type DictionaryEntryInsert = Omit<
  DictionaryEntry,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

export type DictionaryEntryUpdate = Partial<DictionaryEntryInsert>

export type DictionarySortOption =
  | 'created_at_desc'
  | 'created_at_asc'
  | 'japanese_asc'
  | 'english_asc'

export interface SpotifyToken {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  created_at: string
  updated_at: string
}
