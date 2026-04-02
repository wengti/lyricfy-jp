export default function Loading() {
  const lineWidths = [
    'w-full', 'w-11/12', 'w-4/5', 'w-full',
    'w-3/4', 'w-full', 'w-11/12', 'w-4/5',
    'w-3/4', 'w-full', 'w-4/5', 'w-3/4',
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800 mb-6" />

      {/* Track title + artist */}
      <div className="mb-8 space-y-1.5">
        <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Lyric lines */}
      <div className="space-y-3">
        {lineWidths.map((w, i) => (
          <div key={i} className="space-y-1">
            <div className={`h-5 rounded bg-gray-200 dark:bg-gray-800 ${w}`} />
            <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  )
}
