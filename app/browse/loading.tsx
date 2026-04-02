export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-pulse">
      {/* Header: icon + title */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-7 w-36 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Search input */}
      <div className="h-11 w-full rounded-lg bg-gray-200 dark:bg-gray-800 mb-6" />

      {/* Hint text */}
      <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-800 mx-auto" />
    </div>
  )
}
