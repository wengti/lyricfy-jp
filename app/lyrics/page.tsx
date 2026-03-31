'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Music, Link as LinkIcon, AlertTriangle, Navigation } from 'lucide-react'
import { useNowPlaying } from '@/hooks/useNowPlaying'
import { useLyrics } from '@/hooks/useLyrics'
import { useFurigana } from '@/hooks/useFurigana'
import { useDictionary } from '@/hooks/useDictionary'
import { detectScript } from '@/lib/utils/japanese'
import NowPlayingBanner from '@/components/lyrics/NowPlayingBanner'
import LyricsDisplay from '@/components/lyrics/LyricsDisplay'
import ManualLyricsInput from '@/components/lyrics/ManualLyricsInput'
import SaveToDictionaryModal from '@/components/lyrics/SaveToDictionaryModal'
import type { LrcLine } from '@/types/ai'

export default function LyricsPage() {
  const searchParams = useSearchParams()
  const spotifyConnected = searchParams.get('spotify_connected') === '1'
  const spotifyError = searchParams.get('spotify_error')

  const { connected, playing, loading: spotifyLoading } = useNowPlaying()
  const [manualLines, setManualLines] = useState<LrcLine[] | null>(null)
  const [furiganaBust, setFuriganaBust] = useState(0)
  const [romajiConverting, setRomajiConverting] = useState(false)
  const conversionControllerRef = useRef<AbortController | null>(null)
  // Persists manually pasted lyrics per track so they survive song switches
  const manualLinesMap = useRef<Map<string, LrcLine[]>>(new Map())
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const track = playing?.track ?? null
  const { result: lyricsResult, loading: lyricsLoading } = useLyrics(
    track?.name ?? null,
    track?.artist ?? null
  )

  // Use manual lines if provided, otherwise use fetched lines
  const activeLyricsResult = manualLines
    ? { lines: manualLines, synced: false, notFound: false, isJapanese: true, wasRomaji: false, source: 'manual' as const }
    : lyricsResult

  const rawLines = useMemo(
    () => activeLyricsResult?.isJapanese ? activeLyricsResult.lines.map((l) => l.text) : null,
    // Depend on lyricsResult (stable state ref) and manualLines so rawLines is only
    // recomputed when actual lyrics data changes, not on every progress-tick re-render.
    // Using track?.id was wrong — it changed before lyricsResult cleared, causing
    // the memo to return the previous song's lines under the new track metadata.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lyricsResult, manualLines]
  )

  const { translatedLines, loading: furiganaLoading, error: furiganaError } = useFurigana(rawLines, track?.name ?? null, track?.artist ?? null, furiganaBust)
  const { addEntry } = useDictionary()

  // Restore per-song manual lines (or null) when track changes
  useEffect(() => {
    conversionControllerRef.current?.abort()
    conversionControllerRef.current = null
    setRomajiConverting(false)
    const stored = track?.id ? (manualLinesMap.current.get(track.id) ?? null) : null
    setManualLines(stored)
    setFuriganaBust(0)
    setAutoScroll(true)
  }, [track?.id])

  // Disable auto-scroll when user manually scrolls
  useEffect(() => {
    function onUserScroll() {
      setAutoScroll(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        setAutoScroll(false)
      }
    }

    window.addEventListener('wheel', onUserScroll, { passive: true })
    window.addEventListener('touchmove', onUserScroll, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('wheel', onUserScroll)
      window.removeEventListener('touchmove', onUserScroll)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const progressMs = playing?.progressMs ?? 0

  async function handleManualSubmit(lines: LrcLine[]) {
    // Abort any previous in-flight conversion
    conversionControllerRef.current?.abort()
    const controller = new AbortController()
    conversionControllerRef.current = controller

    const texts = lines.map((l) => l.text)
    if (detectScript(texts) === 'romaji') {
      setRomajiConverting(true)
      try {
        const res = await fetch('/api/ai/romaji-to-japanese', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines: texts }),
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        if (!res.ok) throw new Error('Romaji conversion failed')
        const data = await res.json()
        if (controller.signal.aborted) return
        const converted: LrcLine[] = (data.lines as string[]).map((text, i) => ({
          ms: lines[i].ms,
          text,
        }))
        if (track?.id) manualLinesMap.current.set(track.id, converted)
        setManualLines(converted)
      } catch (e) {
        if (controller.signal.aborted) return
        // Fall back to original lines if conversion fails
        if (track?.id) manualLinesMap.current.set(track.id, lines)
        setManualLines(lines)
      } finally {
        if (!controller.signal.aborted) setRomajiConverting(false)
      }
    } else {
      if (controller.signal.aborted) return
      if (track?.id) manualLinesMap.current.set(track.id, lines)
      setManualLines(lines)
    }
    if (controller.signal.aborted) return
    setFuriganaBust((b) => b + 1)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Spotify status messages */}
      {spotifyConnected && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
          Spotify connected successfully!
        </div>
      )}
      {spotifyError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
          Spotify error: {spotifyError}. Please try reconnecting in Settings.
        </div>
      )}

      {/* Connect Spotify CTA */}
      {!spotifyLoading && !connected && (
        <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white py-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <Music size={32} className="text-gray-300 dark:text-gray-600" />
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Connect your Spotify account</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Play a Japanese song on Spotify to see annotated lyrics here.
            </p>
          </div>
          <a
            href="/api/spotify/connect"
            className="flex items-center gap-1.5 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-600"
          >
            <LinkIcon size={15} />
            Connect Spotify
          </a>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Go to <a href="/settings" className="underline">Settings</a> to add your OpenRouter API key
            for AI furigana &amp; translations. Without it you can still view translations cached by other users.
          </p>
        </div>
      )}

      {/* Now Playing Banner */}
      {connected && playing && (
        <NowPlayingBanner playing={playing} />
      )}

      {/* No song playing */}
      {connected && !playing && !spotifyLoading && (
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white py-8 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500">
          Play a song on Spotify to get started.
        </div>
      )}

      {/* Lyrics loading */}
      {connected && playing && lyricsLoading && (
        <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
          Fetching lyrics…
        </div>
      )}

      {/* Not Japanese */}
      {activeLyricsResult && !activeLyricsResult.isJapanese && !activeLyricsResult.notFound && !manualLines && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <AlertTriangle size={16} className="mb-1 inline" /> No Japanese lyrics detected for this song.
        </div>
      )}

      {/* Lyrics not found */}
      {activeLyricsResult?.notFound && !manualLines && (
        <ManualLyricsInput onSubmit={handleManualSubmit} />
      )}

      {/* Replace lyrics — admins only; non-admins see a contact prompt */}
      {activeLyricsResult && !activeLyricsResult.notFound && (
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

      {romajiConverting && (
        <div className="mb-4 py-2 text-center text-sm text-gray-400 animate-pulse dark:text-gray-500">
          Converting romaji to Japanese…
        </div>
      )}

      {/* Main lyrics display */}
      {activeLyricsResult && activeLyricsResult.lines.length > 0 && (
        <LyricsDisplay
          lines={activeLyricsResult.lines}
          synced={activeLyricsResult.synced}
          source={activeLyricsResult.source ?? null}
          translatedLines={activeLyricsResult.isJapanese ? translatedLines : null}
          translationsLoading={activeLyricsResult.isJapanese && furiganaLoading}
          furiganaError={activeLyricsResult.isJapanese ? furiganaError : null}
          progressMs={progressMs}
          autoScroll={autoScroll}
          onSelectPhrase={activeLyricsResult.isJapanese ? (phrase) => setSelectedPhrase(phrase) : undefined}
        />
      )}

      {/* Save to dictionary modal */}
      {selectedPhrase && (
        <SaveToDictionaryModal
          phrase={selectedPhrase}
          sourceSong={track?.name}
          sourceArtist={track?.artist}
          onClose={() => setSelectedPhrase(null)}
          onSave={addEntry}
        />
      )}

      {/* Sync button — shown when user has scrolled away from active line */}
      {!autoScroll && playing && (
        <button
          onClick={() => setAutoScroll(true)}
          className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700"
        >
          <Navigation size={15} />
          Sync lyrics
        </button>
      )}
    </div>
  )
}
