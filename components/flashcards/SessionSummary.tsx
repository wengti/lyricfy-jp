import type { DictionaryEntry, WordStat } from '@/types/database'

function StatBadge({ stat }: { stat: WordStat | undefined }) {
  if (!stat || stat.attempt_count === 0) return null
  const pct = Math.round((stat.success_count / stat.attempt_count) * 100)
  const color =
    pct >= 80 ? 'text-green-600 dark:text-green-400' :
    pct >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
  return (
    <span className={`shrink-0 text-xs font-medium ${color}`}>
      {pct}%<span className="font-normal text-gray-400 dark:text-gray-500"> · {stat.attempt_count}×</span>
    </span>
  )
}

interface Props {
  gotIt: DictionaryEntry[]
  missed: DictionaryEntry[]
  stats?: Record<string, WordStat>
  onRetryMissed: () => void
  onStartOver: () => void
}

export default function SessionSummary({ gotIt, missed, stats, onRetryMissed, onStartOver }: Props) {
  const total = gotIt.length + missed.length
  const pct = total > 0 ? Math.round((gotIt.length / total) * 100) : 0

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-2 text-5xl font-bold text-gray-900 dark:text-gray-100">{pct}%</div>
      <p className="mb-1 text-gray-500 dark:text-gray-400">
        {gotIt.length} of {total} correct
      </p>

      {/* Score bar */}
      <div className="mx-auto mt-4 mb-8 h-3 w-full max-w-xs overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-green-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {missed.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">Words to review ({missed.length}):</p>
          <div className="space-y-2 text-left">
            {missed.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2 dark:border-red-800 dark:bg-red-900/30">
                <span className="font-medium text-red-800 dark:text-red-300">{e.japanese_text}</span>
                <div className="flex items-center gap-2">
                  {stats && <StatBadge stat={stats[e.id]} />}
                  <span className="text-sm text-red-500 dark:text-red-400">{e.english_translation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3">
        {missed.length > 0 && (
          <button
            onClick={onRetryMissed}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Retry missed ({missed.length})
          </button>
        )}
        <button
          onClick={onStartOver}
          className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          New session
        </button>
      </div>
    </div>
  )
}
