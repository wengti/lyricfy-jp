export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-7 w-28 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-5 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Filter row */}
      <div className="mb-4 flex gap-3">
        <div className="h-10 flex-1 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Table — desktop */}
      <div className="hidden sm:block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="h-10 bg-gray-100 dark:bg-gray-800" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 dark:border-gray-800"
          >
            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>

      {/* Card list — mobile */}
      <div className="sm:hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-4 space-y-2">
            <div className="h-5 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  )
}
