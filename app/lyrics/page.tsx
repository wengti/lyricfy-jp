'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Music, Link as LinkIcon, AlertTriangle } from 'lucide-react'
import { useNowPlaying } from '@/hooks/useNowPlaying'
import { useLyrics } from '@/hooks/useLyrics'
import { useFurigana } from '@/hooks/useFurigana'
import { useDictionary } from '@/hooks/useDictionary'
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
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null)

  const track = playing?.track ?? null
  const { result: lyricsResult, loading: lyricsLoading } = useLyrics(
    track?.name ?? null,
    track?.artist ?? null
  )

  // Use manual lines if provided, otherwise use fetched lines
  const activeLyricsResult = manualLines
    ? { lines: manualLines, synced: false, notFound: false, isJapanese: true, wasRomaji: false }
    : lyricsResult

  const rawLines = activeLyricsResult?.isJapanese
    ? activeLyricsResult.lines.map((l) => l.text)
    : null

  const { translatedLines, loading: furiganaLoading } = useFurigana(rawLines)
  const { addEntry } = useDictionary()

  // Reset manual lines when track changes
  useEffect(() => {
    setManualLines(null)
  }, [track?.id])

  const progressMs = playing?.progressMs ?? 0

  // Handle romaji → auto-convert note
  const wasRomaji = activeLyricsResult?.wasRomaji ?? false

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Spotify status messages */}
      {spotifyConnected && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Spotify connected successfully!
        </div>
      )}
      {spotifyError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Spotify error: {spotifyError}. Please try reconnecting in Settings.
        </div>
      )}

      {/* Connect Spotify CTA */}
      {!spotifyLoading && !connected && (
        <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white py-10 text-center">
          <Music size={32} className="text-gray-300" />
          <div>
            <p className="font-medium text-gray-700">Connect your Spotify account</p>
            <p className="mt-1 text-sm text-gray-400">
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
          <p className="text-xs text-gray-400">
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
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white py-8 text-center text-sm text-gray-400">
          Play a song on Spotify to get started.
        </div>
      )}

      {/* Lyrics loading */}
      {connected && playing && lyricsLoading && (
        <div className="py-16 text-center text-sm text-gray-400">
          Fetching lyrics…
        </div>
      )}

      {/* Not Japanese */}
      {activeLyricsResult && !activeLyricsResult.isJapanese && !activeLyricsResult.notFound && !manualLines && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
          <AlertTriangle size={16} className="mb-1 inline" /> No Japanese lyrics detected for this song.
        </div>
      )}

      {/* Romaji converted notice */}
      {wasRomaji && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-600">
          These lyrics were in romaji — converted to Japanese script by AI. May not be 100% accurate.
        </div>
      )}

      {/* Lyrics not found */}
      {activeLyricsResult?.notFound && !manualLines && (
        <ManualLyricsInput onSubmit={setManualLines} />
      )}

      {/* Furigana loading */}
      {activeLyricsResult?.isJapanese && furiganaLoading && (
        <div className="py-8 text-center text-sm text-gray-400">
          Generating furigana annotations…
        </div>
      )}

      {/* Main lyrics display */}
      {activeLyricsResult?.isJapanese && !furiganaLoading && activeLyricsResult.lines.length > 0 && (
        <LyricsDisplay
          lines={activeLyricsResult.lines}
          synced={activeLyricsResult.synced}
          translatedLines={translatedLines}
          progressMs={progressMs}
          onSelectPhrase={(phrase) => setSelectedPhrase(phrase)}
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
    </div>
  )
}
