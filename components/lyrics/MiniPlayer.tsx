import Image from 'next/image'
import { SkipBack, SkipForward, Play, Pause } from 'lucide-react'
import SeekBar from '@/components/lyrics/SeekBar'
import type { NowPlayingState } from '@/types/spotify'

type PlaybackAction = 'play' | 'pause' | 'next' | 'previous'

interface Props {
  playing: NowPlayingState
  seekVersion: number
  onControl: (action: PlaybackAction) => Promise<void>
  onSeek: (positionMs: number) => void
  controlLoading: boolean
}

export default function MiniPlayer({ playing, seekVersion, onControl, onSeek, controlLoading }: Props) {
  const { track, isPlaying, progressMs } = playing
  if (!track) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-80 -translate-x-1/2 rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/90">
      <div className="flex items-center gap-3">
        {track.albumArt && (
          <Image
            src={track.albumArt}
            alt={track.name}
            width={36}
            height={36}
            className="shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{track.name}</p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{track.artist}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => onControl('previous')}
            disabled={controlLoading}
            aria-label="Previous track"
            className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={() => onControl(isPlaying ? 'pause' : 'play')}
            disabled={controlLoading}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={() => onControl('next')}
            disabled={controlLoading}
            aria-label="Next track"
            className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>
      <SeekBar
        progressMs={progressMs}
        durationMs={track.durationMs}
        seekVersion={seekVersion}
        onSeek={onSeek}
        className="mt-2"
      />
    </div>
  )
}
