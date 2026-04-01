'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Music, Link as LinkIcon, AlertTriangle, Navigation } from 'lucide-react'
import { useNowPlaying } from '@/hooks/useNowPlaying'
import { useLyrics } from '@/hooks/useLyrics'
import { useFurigana } from '@/hooks/useFurigana'
import { useDictionary } from '@/hooks/useDictionary'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { detectScript } from '@/lib/utils/japanese'
import NowPlayingBanner from '@/components/lyrics/NowPlayingBanner'
import MiniPlayer from '@/components/lyrics/MiniPlayer'
import LyricsDisplay from '@/components/lyrics/LyricsDisplay'
import ManualLyricsInput from '@/components/lyrics/ManualLyricsInput'
import SaveToDictionaryModal from '@/components/lyrics/SaveToDictionaryModal'
import SyncedVersionBanner from '@/components/lyrics/SyncedVersionBanner'
import type { LrcLine, TranslatedLine } from '@/types/ai'

export default function LyricsPage() {
  const searchParams = useSearchParams()
  const spotifyConnected = searchParams.get('spotify_connected') === '1'
  const spotifyError = searchParams.get('spotify_error')

  const { connected, playing, loading: spotifyLoading, seekVersion } = useNowPlaying()
  const isAdmin = useIsAdmin()
  const [manualLines, setManualLines] = useState<LrcLine[] | null>(null)
  const [furiganaBust, setFuriganaBust] = useState(0)
  const [showReplace, setShowReplace] = useState(false)
  const [retranslating, setRetranslating] = useState(false)
  const [overrideTranslations, setOverrideTranslations] = useState<TranslatedLine[] | null>(null)
  const [romajiConverting, setRomajiConverting] = useState(false)
  const conversionControllerRef = useRef<AbortController | null>(null)
  // Persists manually pasted lyrics per track so they survive song switches
  const manualLinesMap = useRef<Map<string, LrcLine[]>>(new Map())
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [controlLoading, setControlLoading] = useState(false)
  const [scopeError, setScopeError] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
  const bannerRef = useRef<HTMLDivElement>(null)
  const [syncedUpgrade, setSyncedUpgrade] = useState<{ lines: LrcLine[] } | null>(null)
  const [acceptingUpgrade, setAcceptingUpgrade] = useState(false)
  const [upgradedSyncLines, setUpgradedSyncLines] = useState<LrcLine[] | null>(null)
  const [lrclibChecked, setLrclibChecked] = useState(false)

  const track = playing?.track ?? null
  const { result: lyricsResult, loading: lyricsLoading, invalidate: invalidateLyrics } = useLyrics(
    track?.name ?? null,
    track?.artist ?? null
  )

  // Use manual lines if provided, otherwise use fetched lines.
  // If admin accepted a synced upgrade this session, overlay the new synced lines.
  const activeLyricsResult = useMemo(() => {
    const base = manualLines
      ? { lines: manualLines, synced: false, notFound: false, isJapanese: true, wasRomaji: false, source: 'manual' as const }
      : lyricsResult
    if (upgradedSyncLines && base) {
      return { ...base, lines: upgradedSyncLines, synced: true, source: 'lrclib' as const }
    }
    return base
  }, [manualLines, lyricsResult, upgradedSyncLines])

  const rawLines = useMemo(
    () => activeLyricsResult?.isJapanese ? activeLyricsResult.lines.map((l) => l.text) : null,
    // Depend on lyricsResult (stable state ref) and manualLines so rawLines is only
    // recomputed when actual lyrics data changes, not on every progress-tick re-render.
    // Using track?.id was wrong — it changed before lyricsResult cleared, causing
    // the memo to return the previous song's lines under the new track metadata.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lyricsResult, manualLines]
  )

  // Memoized timestamps — same deps as rawLines so they stay stable across re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lyricsTimestamps = useMemo(
    () => activeLyricsResult?.lines.map((l) => l.ms),
    [lyricsResult, manualLines]
  )

  const { translatedLines, loading: furiganaLoading, error: furiganaError } = useFurigana(
    rawLines, track?.name ?? null, track?.artist ?? null, furiganaBust,
    activeLyricsResult?.wasRomaji ?? false,
    lyricsTimestamps,
    activeLyricsResult?.synced,
  )
  const { addEntry } = useDictionary()

  async function handlePlaybackControl(action: 'play' | 'pause' | 'next' | 'previous') {
    setControlLoading(true)
    try {
      const res = await fetch('/api/spotify/playback-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.status === 403) setScopeError(true)
    } finally {
      setControlLoading(false)
    }
  }

  async function handleSeek(positionMs: number) {
    setControlLoading(true)
    try {
      const res = await fetch('/api/spotify/playback-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seek', position_ms: positionMs }),
      })
      if (res.status === 403) setScopeError(true)
    } finally {
      setControlLoading(false)
    }
  }

  // Restore per-song manual lines (or null) when track changes
  useEffect(() => {
    conversionControllerRef.current?.abort()
    conversionControllerRef.current = null
    setRomajiConverting(false)
    const stored = track?.id ? (manualLinesMap.current.get(track.id) ?? null) : null
    setManualLines(stored)
    setFuriganaBust(0)
    setShowReplace(false)
    setAutoScroll(true)
    setRetranslating(false)
    setOverrideTranslations(null)
    setSyncedUpgrade(null)
    setUpgradedSyncLines(null)
    setLrclibChecked(false)
  }, [track?.id])

  // Show mini player when banner scrolls out of view.
  // Depends on track ID so the observer re-attaches whenever the banner div
  // mounts (i.e. when playing goes from null to a track).
  useEffect(() => {
    const el = bannerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setBannerVisible(entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing?.track?.id])

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

  // Background check: when displaying unsynced Japanese lyrics, silently query lrclib.net
  // to see if a synced version has become available since the cache was written.
  useEffect(() => {
    if (
      !lyricsResult ||
      !lyricsResult.isJapanese ||
      lyricsResult.synced ||
      manualLines ||
      !track?.name ||
      !track?.artist
    ) return

    const controller = new AbortController()
    const params = new URLSearchParams({ track: track.name, artist: track.artist })
    fetch(`/api/lyrics/check-synced?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.hasSynced) setSyncedUpgrade({ lines: d.lines })
        setLrclibChecked(true)
      })
      .catch(() => {})

    return () => controller.abort()
  }, [lyricsResult, track?.name, track?.artist, manualLines])

  const progressMs = playing?.progressMs ?? 0

  async function handleAcceptUpgrade() {
    if (!syncedUpgrade || !track?.name || !track?.artist) return
    setAcceptingUpgrade(true)
    try {
      const lines = syncedUpgrade.lines.map((l) => l.text)
      const timestamps = syncedUpgrade.lines.map((l) => l.ms)
      const res = await fetch('/api/ai/furigana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines,
          track: track.name,
          artist: track.artist,
          syncedUpgrade: true,
          timestamps,
          synced: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setOverrideTranslations(data.lines as TranslatedLine[])
        setUpgradedSyncLines(syncedUpgrade.lines)
        setSyncedUpgrade(null)
        setLrclibChecked(false)
        invalidateLyrics(track.name, track.artist)
      }
    } finally {
      setAcceptingUpgrade(false)
    }
  }

  async function handleRetranslate() {
    if (!activeLyricsResult || !track || !rawLines || rawLines.length === 0) return
    setRetranslating(true)
    try {
      const res = await fetch('/api/ai/furigana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: rawLines,
          track: track.name,
          artist: track.artist,
          force: true,
          timestamps: activeLyricsResult.lines.map((l) => l.ms),
          synced: activeLyricsResult.synced,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setOverrideTranslations(data.lines as TranslatedLine[])
      }
    } finally {
      setRetranslating(false)
    }
  }

  function cancelManualSubmit() {
    conversionControllerRef.current?.abort()
    conversionControllerRef.current = null
    setRomajiConverting(false)
    setShowReplace(false)
  }

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
    setShowReplace(false)
  }

  return (
    <div className={`mx-auto max-w-2xl px-4 py-8 ${playing && !bannerVisible && !selectedPhrase ? 'pb-28' : ''}`}>
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
        <div ref={bannerRef}>
          <NowPlayingBanner
            playing={playing}
            seekVersion={seekVersion}
            onControl={handlePlaybackControl}
            onSeek={handleSeek}
            controlLoading={controlLoading}
            scopeError={scopeError}
          />
        </div>
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
      {activeLyricsResult?.notFound && !manualLines && isAdmin === true && (
        <ManualLyricsInput onSubmit={handleManualSubmit} />
      )}
      {activeLyricsResult?.notFound && !manualLines && isAdmin === false && (
        <div className="mb-4 rounded-xl border border-gray-100 bg-white px-4 py-6 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="m-2 text-sm text-gray-500 dark:text-gray-400">
            No lyrics found for this song.{' '}
            <a
              href="mailto:wengti@hotmail.com"
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              Contact the admin
            </a>
            {' '}to have them added.
          </p>
        </div>
      )}

      {/* Replace lyrics — admins get a paste form; non-admins see a contact prompt */}
      {activeLyricsResult && !activeLyricsResult.notFound && isAdmin === true && !showReplace && (
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
      {activeLyricsResult && !activeLyricsResult.notFound && isAdmin === true && showReplace && (
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
      {activeLyricsResult && !activeLyricsResult.notFound && isAdmin === false && (
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

      {/* Synced upgrade banner */}
      {(syncedUpgrade || lrclibChecked) && track?.name && track?.artist && (
        <SyncedVersionBanner
          lines={syncedUpgrade?.lines}
          isAdmin={isAdmin ?? false}
          onAccept={handleAcceptUpgrade}
          accepting={acceptingUpgrade}
          track={track.name}
          artist={track.artist}
        />
      )}

      {/* Main lyrics display */}
      {activeLyricsResult && activeLyricsResult.lines.length > 0 && (
        <LyricsDisplay
          lines={activeLyricsResult.lines}
          synced={activeLyricsResult.synced}
          source={activeLyricsResult.source ?? null}
          translatedLines={activeLyricsResult.isJapanese ? (overrideTranslations ?? translatedLines) : null}
          translationsLoading={activeLyricsResult.isJapanese && furiganaLoading}
          furiganaError={activeLyricsResult.isJapanese ? furiganaError : null}
          progressMs={progressMs}
          autoScroll={autoScroll}
          onSelectPhrase={activeLyricsResult.isJapanese ? (phrase) => setSelectedPhrase(phrase) : undefined}
          onSeekToLine={activeLyricsResult.synced ? handleSeek : undefined}
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

      {/* Mini player — shown when now-playing banner is scrolled out of view */}
      {playing && !bannerVisible && !selectedPhrase && (
        <MiniPlayer
          playing={playing}
          seekVersion={seekVersion}
          onControl={handlePlaybackControl}
          onSeek={handleSeek}
          controlLoading={controlLoading}
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
