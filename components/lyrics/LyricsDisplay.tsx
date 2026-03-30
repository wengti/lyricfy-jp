'use client'

import { useMemo, useState } from 'react'
import LyricsLine from './LyricsLine'
import type { LrcLine, TranslatedLine } from '@/types/ai'

interface Props {
  lines: LrcLine[]
  synced: boolean
  translatedLines: TranslatedLine[] | null
  progressMs: number
  autoScroll: boolean
  onSelectPhrase?: (text: string, lineIndex: number) => void
}

export default function LyricsDisplay({
  lines,
  synced,
  translatedLines,
  progressMs,
  autoScroll,
  onSelectPhrase,
}: Props) {
  const [showTranslation, setShowTranslation] = useState(true)

  // Find the active line index based on Spotify progress_ms
  const activeIndex = useMemo(() => {
    if (!synced || progressMs === 0) return -1
    let idx = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].ms <= progressMs) idx = i
      else break
    }
    return idx
  }, [lines, synced, progressMs])

  function handleMouseUp() {
    if (!onSelectPhrase) return
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    if (text && text.length > 0) {
      onSelectPhrase(text, activeIndex)
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex items-center justify-end gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none dark:text-gray-400">
          <input
            type="checkbox"
            checked={showTranslation}
            onChange={(e) => setShowTranslation(e.target.checked)}
            className="rounded"
          />
          Show translations
        </label>
      </div>

      {/* Lines */}
      <div className="space-y-1" onMouseUp={handleMouseUp}>
        {lines.map((line, i) => (
          <LyricsLine
            key={i}
            line={translatedLines?.[i] ?? null}
            rawText={line.text}
            isActive={synced ? i === activeIndex : false}
            showTranslation={showTranslation}
            autoScroll={autoScroll}
          />
        ))}
      </div>
    </div>
  )
}
