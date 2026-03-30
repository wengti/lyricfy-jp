import { Pencil, Trash2 } from 'lucide-react'
import type { DictionaryEntry } from '@/types/database'

interface Props {
  entry: DictionaryEntry
  onEdit: (entry: DictionaryEntry) => void
  onDelete: (id: string) => void
}

export default function DictionaryEntryRow({ entry, onEdit, onDelete }: Props) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{entry.japanese_text}</div>
        <div className="text-sm text-gray-500">{entry.hiragana}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{entry.english_translation}</td>
      <td className="px-4 py-3">
        {entry.example_japanese && (
          <div className="text-sm">
            <div className="text-gray-700">{entry.example_japanese}</div>
            <div className="text-gray-400">{entry.example_english}</div>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {entry.source_song && (
          <div className="text-xs text-gray-400">
            {entry.source_song}
            {entry.source_artist && ` — ${entry.source_artist}`}
          </div>
        )}
        {entry.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600"
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
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}
