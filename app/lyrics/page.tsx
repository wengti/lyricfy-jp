'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Music, Link as LinkIcon, AlertTriangle, Navigation } from 'lucide-react'
import { useNowPlaying } from '@/hooks/useNowPlaying'
import { useLyrics } from '@/hooks/useLyrics'
import { useFurigana } from '@/hooks/useFurigana'
import { useDictionary } from '@/hooks/useDictionary'
import NowPlayingBanner from '@/components/lyrics/NowPlayingBanner'
import LyricsDisplay from '@/components/lyrics/LyricsDisplay'
import ManualLyricsInput from '@/components/lyrics/ManualLyricsInput'
import SaveToDictionaryModal from '@/components/lyrics/SaveToDictionaryModal'
import Toast from '@/components/ui/Toast'
import type { LrcLine } from '@/types/ai'

export default function LyricsPage() {
  const searchParams = useSearchParams()
  const spotifyConnected = searchParams.get('spotify_connected') === '1'
  const spotifyError = searchParams.get('spotify_error')

  const { connected, playing, loading: spotifyLoading } = useNowPlaying()
  const [manualLines, setManualLines] = useState<LrcLine[] | null>(null)
  const [showReplace, setShowReplace] = useState(false)
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

  const { translatedLines, loading: furiganaLoading, error: furiganaError } = useFurigana(rawLines, track?.name ?? null, track?.artist ?? null)
  const [toastDismissed, setToastDismissed] = useState(false)

  // Show toast again whenever a new error arrives
  useEffect(() => {
    if (furiganaError) setToastDismissed(false)
  }, [furiganaError])
  const { addEntry } = useDictionary()

  // Reset manual lines and re-enable auto-scroll when track changes
  useEffect(() => {
    setManualLines(null)
    setShowReplace(false)
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
            You&apos;ll need to add your Spotify Client ID and Secret in{' '}
            <a href="/settings" className="underline">Settings</a> first.
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
        <ManualLyricsInput onSubmit={setManualLines} />
      )}

      {/* Replace lyrics — shown when lrclib found something but it may be wrong */}
      {activeLyricsResult && !activeLyricsResult.notFound && !showReplace && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowReplace(true)}
            className="text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            Wrong lyrics? Replace them
          </button>
        </div>
      )}
      {showReplace && (
        <div className="mb-6">
          <ManualLyricsInput
            heading="Paste the correct lyrics below"
            onSubmit={(lines) => { setManualLines(lines); setShowReplace(false) }}
          />
          <button
            onClick={() => setShowReplace(false)}
            className="mt-2 text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Furigana error toast */}
      {furiganaError && !toastDismissed && (
        <Toast
          message={`Translation error: ${furiganaError}`}
          onDismiss={() => setToastDismissed(true)}
        />
      )}

      {/* Main lyrics display */}
      {activeLyricsResult && activeLyricsResult.lines.length > 0 && (
        <LyricsDisplay
          lines={activeLyricsResult.lines}
          synced={activeLyricsResult.synced}
          source={activeLyricsResult.source ?? null}
          translatedLines={activeLyricsResult.isJapanese ? translatedLines : null}
          translationsLoading={activeLyricsResult.isJapanese && furiganaLoading}
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
