'use client'

import { useMemo, useRef, useState } from 'react'
import LyricsLine from './LyricsLine'
import type { LrcLine, TranslatedLine } from '@/types/ai'

interface Props {
  lines: LrcLine[]
  synced: boolean
  source: 'lrclib' | 'lrclib-romaji' | 'genius' | 'manual' | 'manual-romaji' | null
  translatedLines: TranslatedLine[] | null
  translationsLoading?: boolean
  furiganaError?: string | null
  progressMs: number
  autoScroll: boolean
  onSelectPhrase?: (text: string, lineIndex: number) => void
  onSeekToLine?: (ms: number) => void
}

const SOURCE_BADGE: Record<string, Record<string, { label: string; title: string; cls: string }>> = {
  lrclib: {
    synced:   { label: 'lrclib.net · synced',   title: 'Timestamps available — karaoke active',          cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' },
    unsynced: { label: 'lrclib.net · no timestamps', title: 'lrclib has this song but without timestamps — karaoke unavailable', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' },
  },
  'lrclib-romaji': {
    synced:   { label: 'lrclib.net · romaji · synced',   title: 'Romanized lyrics converted to Japanese — karaoke active',    cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' },
    unsynced: { label: 'lrclib.net · romaji · unsynced', title: 'Romanized lyrics converted to Japanese — karaoke unavailable', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' },
  },
  manual: {
    unsynced: { label: 'Manual · unsynced', title: 'Manually pasted lyrics have no timestamps — karaoke unavailable', cls: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' },
  },
  'manual-romaji': {
    unsynced: { label: 'Manual · romaji · unsynced', title: 'Manually pasted romaji lyrics converted to Japanese — karaoke unavailable', cls: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' },
  },
}

export default function LyricsDisplay({
  lines,
  synced,
  source,
  translatedLines,
  translationsLoading,
  furiganaError,
  progressMs,
  autoScroll,
  onSelectPhrase,
  onSeekToLine,
}: Props) {
  const [showTranslation, setShowTranslation] = useState(true)
  const mouseDownLineIndexRef = useRef<number>(-1)

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

  function handleMouseDown(e: React.MouseEvent) {
    // Hide furigana the moment the user starts dragging so the selection never touches it
    document.querySelectorAll<HTMLElement>('rt, rp').forEach((el) => {
      el.style.visibility = 'hidden'
    })
    const lineEl = (e.target as Element).closest('[data-line-index]')
    mouseDownLineIndexRef.current = lineEl ? Number(lineEl.getAttribute('data-line-index')) : -1
  }

  function handleMouseUp() {
    const selection = window.getSelection()
    const text = selection?.toString().trim() ?? ''

    // Restore furigana now that we have the clean text
    document.querySelectorAll<HTMLElement>('rt, rp').forEach((el) => {
      el.style.visibility = ''
    })

    if (onSelectPhrase && text) {
      onSelectPhrase(text, activeIndex)
      mouseDownLineIndexRef.current = -1
      return
    }

    // Plain click on a synced line → seek to that line's timestamp
    const idx = mouseDownLineIndexRef.current
    mouseDownLineIndexRef.current = -1
    if (!text && synced && onSeekToLine && idx >= 0 && lines[idx]?.ms !== undefined) {
      onSeekToLine(lines[idx].ms)
    }
  }

  function handleTouchEnd() {
    // iOS long-press selection doesn't fire mouseup, so we check for selected text here.
    // A short delay lets the selection object settle before we read it.
    setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      // Clone the range and strip rt/rp so furigana isn't included in the saved text.
      const range = selection.getRangeAt(0)
      const fragment = range.cloneContents()
      fragment.querySelectorAll('rt, rp').forEach((el) => el.remove())
      const tmp = document.createElement('div')
      tmp.appendChild(fragment)
      const text = tmp.textContent?.trim() ?? ''

      if (onSelectPhrase && text) {
        onSelectPhrase(text, activeIndex)
        selection.removeAllRanges()
      }
    }, 50)
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Source badge + furigana error badge */}
        <div className="flex items-center gap-2">
          {source && SOURCE_BADGE[source] && (() => {
            const badge = SOURCE_BADGE[source][synced ? 'synced' : 'unsynced'] ?? SOURCE_BADGE[source]['unsynced']
            return badge ? (
              <span title={badge.title} className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                {badge.label}
              </span>
            ) : null
          })()}
          {furiganaError && (
            <span
              title={furiganaError}
              className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              Uncached new song
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {translationsLoading && (
            <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
              Generating furigana…
            </span>
          )}
          {translatedLines && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none dark:text-gray-400">
              <input
                type="checkbox"
                checked={showTranslation}
                onChange={(e) => setShowTranslation(e.target.checked)}
                className="rounded"
              />
              Show translations
            </label>
          )}
        </div>
      </div>

      {/* Lines */}
      <div className="space-y-1" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onTouchEnd={handleTouchEnd}>
        {lines.map((line, i) => (
          <div key={i} data-line-index={i} className={synced && onSeekToLine ? 'cursor-pointer group' : ''}>
            <LyricsLine
              line={translatedLines?.[i] ?? null}
              rawText={line.text}
              isActive={synced ? i === activeIndex : false}
              showTranslation={showTranslation}
              autoScroll={autoScroll}
              canSeek={!!(synced && onSeekToLine)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
