'use client'

import { useState } from 'react'
import { Plus, Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDictionary } from '@/hooks/useDictionary'
import { useWordStats } from '@/hooks/useWordStats'
import DictionaryEntryRow, { DictionaryEntryCard } from '@/components/dictionary/DictionaryEntry'
import AddWordModal from '@/components/dictionary/AddWordModal'
import EditWordModal from '@/components/dictionary/EditWordModal'
import type { DictionaryEntry, DictionarySortOption } from '@/types/database'

const PAGE_SIZE = 20

export default function DictionaryPage() {
  const [sort, setSort] = useState<DictionarySortOption>('created_at_desc')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [page, setPage] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [editEntry, setEditEntry] = useState<DictionaryEntry | null>(null)

  const { entries, loading, error, addEntry, updateEntry, deleteEntry } = useDictionary({
    sort: sort === 'success_rate_asc' ? 'created_at_desc' : sort,
    search,
    tag: tagFilter,
  })
  const { stats } = useWordStats()

  // Collect all unique tags from current entries for the filter dropdown
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort()

  const sortedEntries = sort === 'success_rate_asc'
    ? [...entries].sort((a, b) => {
        const sa = stats[a.id], sb = stats[b.id]
        const ra = sa && sa.attempt_count > 0 ? sa.success_count / sa.attempt_count : 2
        const rb = sb && sb.attempt_count > 0 ? sb.success_count / sb.attempt_count : 2
        return ra - rb
      })
    : entries

  const totalPages = Math.ceil(sortedEntries.length / PAGE_SIZE)
  const pagedEntries = sortedEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function resetPage() { setPage(0) }

  async function handleDelete(id: string) {
    if (!confirm('Delete this word from your dictionary?')) return
    await deleteEntry(id)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dictionary</h1>
          {!loading && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {entries.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} />
          Add word
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            placeholder="Search words…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-indigo-800"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as DictionarySortOption); resetPage() }}
          className="rounded-lg border border-gray-300 py-2 pl-1 pr-8 text-base outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="created_at_desc">Newest first</option>
          <option value="created_at_asc">Oldest first</option>
          <option value="japanese_asc">Japanese A→Z</option>
          <option value="english_asc">English A→Z</option>
          <option value="success_rate_asc">Lowest success rate</option>
        </select>

        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); resetPage() }}
            className="rounded-lg border border-gray-300 py-2 pl-1 pr-8 text-base outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
          <BookOpen size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {search || tagFilter ? 'No words match your filters.' : 'Your dictionary is empty.'}
          </p>
          {!search && !tagFilter && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-3 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Add your first word
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-900">
            {pagedEntries.map((entry) => (
              <DictionaryEntryCard
                key={entry.id}
                entry={entry}
                stat={stats[entry.id]}
                onEdit={setEditEntry}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Japanese</th>
                  <th className="px-4 py-3">English</th>
                  <th className="px-4 py-3">Example</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3 w-40">Source / Tags</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pagedEntries.map((entry) => (
                  <DictionaryEntryRow
                    key={entry.id}
                    entry={entry}
                    stat={stats[entry.id]}
                    onEdit={setEditEntry}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAdd && (
        <AddWordModal
          onClose={() => setShowAdd(false)}
          onSave={addEntry}
        />
      )}
      {editEntry && (
        <EditWordModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSave={updateEntry}
        />
      )}
    </div>
  )
}
