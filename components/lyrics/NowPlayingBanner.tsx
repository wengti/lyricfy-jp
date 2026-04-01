import Image from 'next/image'
import { SkipBack, SkipForward, Play, Pause } from 'lucide-react'
import type { NowPlayingState } from '@/types/spotify'

type PlaybackAction = 'play' | 'pause' | 'next' | 'previous'

interface Props {
  playing: NowPlayingState
  seekVersion: number
  onControl: (action: PlaybackAction) => Promise<void>
  controlLoading: boolean
  scopeError: boolean
}

export default function NowPlayingBanner({ playing, seekVersion, onControl, controlLoading, scopeError }: Props) {
  const { track, isPlaying, progressMs } = playing
  if (!track) return null

  const progressPct = Math.min((progressMs / track.durationMs) * 100, 100)

  return (
    <div className="mb-6 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {track.albumArt && (
        <Image
          src={track.albumArt}
          alt={track.name}
          width={56}
          height={56}
          className="rounded-lg object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isPlaying && (
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block w-0.5 rounded-full bg-indigo-500"
                  style={{
                    height: '12px',
                    animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                  }}
                />
              ))}
            </span>
          )}
          <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{track.name}</p>
        </div>
        <p className="truncate text-sm text-gray-500 dark:text-gray-400">{track.artist}</p>
        {/* Progress bar — keyed by track.id so it remounts instantly on song change */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            key={`${track.id}-${seekVersion}`}
            className="h-full rounded-full bg-indigo-400 transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {scopeError && (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
            <a href="/api/spotify/connect" className="underline hover:text-amber-700 dark:hover:text-amber-300">
              Reconnect Spotify
            </a>
            {' '}to enable playback controls.
          </p>
        )}
      </div>
      {/* Playback controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onControl('previous')}
          disabled={controlLoading}
          aria-label="Previous track"
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={() => onControl(isPlaying ? 'pause' : 'play')}
          disabled={controlLoading}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={() => onControl('next')}
          disabled={controlLoading}
          aria-label="Next track"
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <SkipForward size={18} />
        </button>
      </div>
    </div>
  )
}
