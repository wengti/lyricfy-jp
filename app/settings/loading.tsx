export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 animate-pulse">
      {/* h1 Settings */}
      <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-800 mb-8" />

      {/* Account card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 mb-6">
        <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-4" />
        <div className="flex justify-between mb-3">
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      {/* API keys card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-800 mb-3" />
        <div className="space-y-2 mb-6">
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="space-y-3 mb-6">
          <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
          <div className="h-10 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  )
}
