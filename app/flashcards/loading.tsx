export default function Loading() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 animate-pulse">
      {/* Header */}
      <div className="mb-8 flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-7 w-32 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Setup card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-6">
        {/* Quiz mode */}
        <div>
          <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-12 rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>

        {/* Select words */}
        <div>
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
          {/* Shortcut pills */}
          <div className="mb-3 flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-7 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
          {/* Search */}
          <div className="h-9 w-full rounded-lg bg-gray-200 dark:bg-gray-800 mb-2" />
          {/* Word list */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 border-t first:border-t-0 border-gray-100 dark:border-gray-800"
              >
                <div className="h-3.5 w-3.5 rounded bg-gray-200 dark:bg-gray-800 shrink-0" />
                <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  )
}
