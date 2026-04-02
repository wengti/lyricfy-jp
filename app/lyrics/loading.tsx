export default function Loading() {
  const lineWidths = [
    'w-full', 'w-11/12', 'w-4/5', 'w-3/4', 'w-full',
    'w-11/12', 'w-4/5', 'w-full', 'w-3/4', 'w-4/5',
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-pulse">
      {/* Now Playing banner */}
      <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
        {/* Playback controls */}
        <div className="mt-3 flex justify-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Lyric lines */}
      <div className="space-y-4">
        {lineWidths.map((w, i) => (
          <div key={i} className="space-y-1">
            <div className={`h-6 rounded bg-gray-200 dark:bg-gray-800 ${w}`} />
            <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  )
}
