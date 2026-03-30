import Image from 'next/image'
import type { NowPlayingState } from '@/types/spotify'

interface Props {
  playing: NowPlayingState
}

export default function NowPlayingBanner({ playing }: Props) {
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
            key={track.id}
            className="h-full rounded-full bg-indigo-400 transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
