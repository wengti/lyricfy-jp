'use client'

import { useState } from 'react'
import LyricsDisplay from '@/components/lyrics/LyricsDisplay'
import SaveToDictionaryModal from '@/components/lyrics/SaveToDictionaryModal'
import { useDictionary } from '@/hooks/useDictionary'
import type { LrcLine, TranslatedLine } from '@/types/ai'

interface Props {
  lines: LrcLine[]
  translatedLines: TranslatedLine[]
  source: 'lrclib' | 'lrclib-romaji' | 'manual' | null
  synced: boolean
  trackName: string
  artist: string
}

export default function BrowseDetailClient({
  lines,
  translatedLines,
  source,
  synced,
  trackName,
  artist,
}: Props) {
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null)
  const { addEntry } = useDictionary()

  return (
    <>
      <LyricsDisplay
        lines={lines}
        synced={synced}
        source={source}
        translatedLines={translatedLines.length > 0 ? translatedLines : null}
        translationsLoading={false}
        furiganaError={null}
        progressMs={0}
        autoScroll={false}
        onSelectPhrase={(phrase) => setSelectedPhrase(phrase)}
      />
      {selectedPhrase && (
        <SaveToDictionaryModal
          phrase={selectedPhrase}
          sourceSong={trackName}
          sourceArtist={artist}
          onClose={() => setSelectedPhrase(null)}
          onSave={addEntry}
        />
      )}
    </>
  )
}
