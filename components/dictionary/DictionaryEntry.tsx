import { Pencil, Trash2 } from 'lucide-react'
import type { DictionaryEntry, WordStat } from '@/types/database'
import type { FuriganaToken } from '@/types/ai'

function FuriganaText({ tokens, fallback }: { tokens: FuriganaToken[]; fallback: string }) {
  return (
    <span>
      {tokens.map((t, i) =>
        t.reading ? (
          <ruby key={i}>
            {t.original}
            <rp>(</rp>
            <rt className="text-xs font-normal">{t.reading}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{t.original}</span>
        )
      )}
      {tokens.length === 0 && fallback}
    </span>
  )
}

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
  entry: DictionaryEntry
  onEdit: (entry: DictionaryEntry) => void
  onDelete: (id: string) => void
  stat?: WordStat
}

/** Desktop table row — used inside <tbody> on sm+ screens */
export default function DictionaryEntryRow({ entry, onEdit, onDelete, stat }: Props) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900 dark:text-gray-100">{entry.japanese_text}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{entry.hiragana}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{entry.english_translation}</td>
      <td className="px-4 py-3">
        {entry.example_japanese && (
          <div className="text-sm">
            <div className="text-gray-700 dark:text-gray-300">
              {entry.example_furigana && entry.example_furigana.length > 0
                ? <FuriganaText tokens={entry.example_furigana} fallback={entry.example_japanese} />
                : entry.example_japanese}
            </div>
            <div className="text-gray-400 dark:text-gray-500">{entry.example_english}</div>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <StatBadge stat={stat} />
      </td>
      <td className="px-4 py-3 max-w-0 w-40">
        {entry.source_song && (
          <div
            className="truncate text-xs text-gray-400 dark:text-gray-500"
            title={`${entry.source_song}${entry.source_artist ? ` — ${entry.source_artist}` : ''}`}
          >
            {entry.source_song}
            {entry.source_artist && ` — ${entry.source_artist}`}
          </div>
        )}
        {entry.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(entry)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            aria-label="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}

/** Mobile card — used in a stacked list on screens narrower than sm */
export function DictionaryEntryCard({ entry, onEdit, onDelete, stat }: Props) {
  return (
    <div className="px-4 py-3">
      {/* Word + stat + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-medium text-gray-900 dark:text-gray-100">{entry.japanese_text}</span>
          {entry.hiragana && (
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{entry.hiragana}</span>
          )}
          {stat && (
            <span className="ml-2">
              <StatBadge stat={stat} />
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(entry)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            aria-label="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* English */}
      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{entry.english_translation}</div>

      {/* Example */}
      {entry.example_japanese && (
        <div className="mt-2 text-sm">
          <div className="text-gray-600 dark:text-gray-300">
            {entry.example_furigana && entry.example_furigana.length > 0
              ? <FuriganaText tokens={entry.example_furigana} fallback={entry.example_japanese} />
              : entry.example_japanese}
          </div>
          {entry.example_english && (
            <div className="text-gray-400 dark:text-gray-500">{entry.example_english}</div>
          )}
        </div>
      )}

      {/* Source + tags */}
      {(entry.source_song || entry.tags.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {entry.source_song && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {entry.source_song}
              {entry.source_artist && ` — ${entry.source_artist}`}
            </span>
          )}
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
