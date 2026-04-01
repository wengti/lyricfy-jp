'use client'

import { useState, useRef, useEffect } from 'react'
import LyricsDisplay from '@/components/lyrics/LyricsDisplay'
import SaveToDictionaryModal from '@/components/lyrics/SaveToDictionaryModal'
import ManualLyricsInput from '@/components/lyrics/ManualLyricsInput'
import SyncedVersionBanner from '@/components/lyrics/SyncedVersionBanner'
import { useDictionary } from '@/hooks/useDictionary'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { detectScript } from '@/lib/utils/japanese'
import type { LrcLine, TranslatedLine } from '@/types/ai'

interface Props {
  lines: LrcLine[]
  translatedLines: TranslatedLine[]
  source: 'lrclib' | 'lrclib-romaji' | 'manual' | 'manual-romaji' | null
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

  const isAdmin = useIsAdmin()
  const conversionControllerRef = useRef<AbortController | null>(null)

  const [retranslating, setRetranslating] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [romajiConverting, setRomajiConverting] = useState(false)
  const [activeLines, setActiveLines] = useState<LrcLine[]>(lines)
  const [activeTranslatedLines, setActiveTranslatedLines] = useState<TranslatedLine[]>(translatedLines)
  const [activeSource, setActiveSource] = useState(source)
  const [activeSynced, setActiveSynced] = useState(synced)

  const [syncedUpgrade, setSyncedUpgrade] = useState<{ lines: LrcLine[] } | null>(null)
  const [lrclibChecked, setLrclibChecked] = useState(false)
  const [acceptingUpgrade, setAcceptingUpgrade] = useState(false)

  const lyricsExist = activeLines.length > 0

  // Background check: look for a synced version on lrclib.net when displaying unsynced lyrics
  useEffect(() => {
    if (activeSynced) return

    const controller = new AbortController()
    const params = new URLSearchParams({ track: trackName, artist })
    fetch(`/api/lyrics/check-synced?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (d.hasSynced) setSyncedUpgrade({ lines: d.lines })
        setLrclibChecked(true)
      })
      .catch(() => {})

    return () => controller.abort()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAcceptUpgrade() {
    if (!syncedUpgrade) return
    setAcceptingUpgrade(true)
    try {
      const res = await fetch('/api/ai/furigana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: syncedUpgrade.lines.map(l => l.text),
          track: trackName,
          artist,
          syncedUpgrade: true,
          timestamps: syncedUpgrade.lines.map(l => l.ms),
          synced: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setActiveLines(syncedUpgrade.lines)
        setActiveTranslatedLines(data.lines as TranslatedLine[])
        setActiveSynced(true)
        setActiveSource('lrclib')
        setSyncedUpgrade(null)
        setLrclibChecked(false)
      }
    } finally {
      setAcceptingUpgrade(false)
    }
  }

  async function handleRetranslate() {
    if (activeLines.length === 0) return
    setRetranslating(true)
    try {
      const res = await fetch('/api/ai/furigana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: activeLines.map(l => l.text),
          track: trackName,
          artist,
          force: true,
          timestamps: activeLines.map(l => l.ms),
          synced: activeSynced,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setActiveTranslatedLines(data.lines as TranslatedLine[])
      }
    } finally {
      setRetranslating(false)
    }
  }

  async function handleManualSubmit(submittedLines: LrcLine[]) {
    conversionControllerRef.current?.abort()
    const controller = new AbortController()
    conversionControllerRef.current = controller

    let linesToProcess = submittedLines
    const texts = submittedLines.map(l => l.text)
    const isRomaji = detectScript(texts) === 'romaji'

    if (isRomaji) {
      setRomajiConverting(true)
      try {
        const res = await fetch('/api/ai/romaji-to-japanese', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines: texts }),
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        if (!res.ok) throw new Error('Conversion failed')
        const data = await res.json()
        if (controller.signal.aborted) return
        linesToProcess = (data.lines as string[]).map((text, i) => ({
          ms: submittedLines[i].ms,
          text,
        }))
      } catch {
        if (controller.signal.aborted) return
        // fall back to original lines on conversion error
      } finally {
        if (!controller.signal.aborted) setRomajiConverting(false)
      }
    }

    if (controller.signal.aborted) return

    setShowReplace(false)
    setRetranslating(true)
    try {
      const res = await fetch('/api/ai/furigana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: linesToProcess.map(l => l.text),
          track: trackName,
          artist,
          force: true,
          wasRomaji: isRomaji,
          timestamps: linesToProcess.map(l => l.ms),
          synced: false,
        }),
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      if (res.ok) {
        const data = await res.json()
        const newTranslated = data.lines as TranslatedLine[]
        const newLines: LrcLine[] = newTranslated
          .map((tl, i) => ({
            ms: linesToProcess[i]?.ms ?? 0,
            text: tl.tokens.length > 0
              ? tl.tokens.map(t => t.original).join('')
              : tl.translation,
          }))
          .filter(l => l.text.trim())
        setActiveLines(newLines)
        setActiveTranslatedLines(newTranslated)
        setActiveSource(isRomaji ? 'manual-romaji' : 'manual')
      }
    } finally {
      if (!controller.signal.aborted) setRetranslating(false)
    }

  }

  function cancelManualSubmit() {
    conversionControllerRef.current?.abort()
    conversionControllerRef.current = null
    setRomajiConverting(false)
    setShowReplace(false)
  }

  return (
    <>
      {/* Synced version banner */}
      {(syncedUpgrade || lrclibChecked) && (
        <SyncedVersionBanner
          lines={syncedUpgrade?.lines}
          isAdmin={isAdmin ?? false}
          onAccept={handleAcceptUpgrade}
          accepting={acceptingUpgrade}
          track={trackName}
          artist={artist}
        />
      )}

      {/* Admin: retranslate + replace buttons */}
      {lyricsExist && isAdmin === true && !showReplace && (
        <div className="mb-4 flex items-center justify-end gap-4">
          <button
            onClick={handleRetranslate}
            disabled={retranslating}
            className="text-xs text-gray-400 underline hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {retranslating ? 'Translating…' : 'Re-translate'}
          </button>
          <button
            onClick={() => setShowReplace(true)}
            className="text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            Wrong lyrics? Replace them
          </button>
        </div>
      )}

      {/* Admin: manual lyrics form */}
      {lyricsExist && isAdmin === true && showReplace && (
        <div className="mb-6">
          <ManualLyricsInput
            heading="Paste the correct lyrics below"
            onSubmit={handleManualSubmit}
          />
          <button
            onClick={cancelManualSubmit}
            className="mt-2 text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Non-admin: contact link */}
      {lyricsExist && isAdmin === false && (
        <div className="mb-4 flex justify-end">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Wrong lyrics?{' '}
            <a
              href="mailto:wengti@hotmail.com"
              className="underline hover:text-gray-600 dark:hover:text-gray-300"
            >
              Contact the admin
            </a>
          </p>
        </div>
      )}

      {/* Romaji conversion spinner */}
      {romajiConverting && (
        <div className="mb-4 py-2 text-center text-sm text-gray-400 animate-pulse dark:text-gray-500">
          Converting romaji to Japanese…
        </div>
      )}

      <LyricsDisplay
        lines={activeLines}
        synced={activeSynced}
        source={activeSource}
        translatedLines={activeTranslatedLines.length > 0 ? activeTranslatedLines : null}
        translationsLoading={retranslating || romajiConverting}
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
