'use client'

import { useState, useCallback, useEffect } from 'react'
import { CreditCard, Shuffle, RotateCcw, Circle, CheckCircle, XCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useDictionary } from '@/hooks/useDictionary'
import { useWordStats } from '@/hooks/useWordStats'
import FlashcardCard from '@/components/flashcards/FlashcardCard'
import SessionSummary from '@/components/flashcards/SessionSummary'
import type { DictionaryEntry, WordStat } from '@/types/database'

type Mode = 'jp-to-en' | 'en-to-jp'
type Phase = 'setup' | 'session' | 'summary'
type CardStatus = 'unanswered' | 'got-it' | 'missed'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildResults(q: DictionaryEntry[], s: CardStatus[]) {
  return q.map((e, i) => ({ word_id: e.id, got_it: s[i] === 'got-it' }))
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

export default function FlashcardsPage() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [mode, setMode] = useState<Mode>('jp-to-en')
  const [tagFilter, setTagFilter] = useState('')
  const [queue, setQueue] = useState<DictionaryEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [statuses, setStatuses] = useState<CardStatus[]>([])
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [wordListPage, setWordListPage] = useState(1)

  const { entries, loading } = useDictionary({ sort: 'created_at_desc', tag: tagFilter })
  const { stats, submitSession } = useWordStats()
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort()

  // Reset selection to last 30 whenever entries change (tag filter or initial load)
  useEffect(() => {
    setSelectedIds(new Set(entries.slice(0, 30).map((e) => e.id)))
    setSearchQuery('')
    setWordListPage(1)
  }, [entries])

  function handleModeChange(m: Mode) {
    setMode(m)
    setSearchQuery('')
    // selectedIds intentionally preserved
  }

  // Derived values
  const displayKey = mode === 'jp-to-en' ? 'japanese_text' : 'english_translation'

  const filteredEntries = searchQuery
    ? entries.filter(
        (e) =>
          e[displayKey].toLowerCase().includes(searchQuery.toLowerCase()) ||
          (mode === 'jp-to-en' && e.hiragana.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : entries

  const WORD_PAGE_SIZE = 8
  const totalWordPages = Math.max(1, Math.ceil(filteredEntries.length / WORD_PAGE_SIZE))
  const clampedWordListPage = Math.min(wordListPage, totalWordPages)
  const pagedEntries = filteredEntries.slice(
    (clampedWordListPage - 1) * WORD_PAGE_SIZE,
    clampedWordListPage * WORD_PAGE_SIZE
  )

  const selectedEntries = entries.filter((e) => selectedIds.has(e.id))

  // Shortcut handlers
  function selectLast30() { setSelectedIds(new Set(entries.slice(0, 30).map((e) => e.id))) }
  function selectFirst30() { setSelectedIds(new Set(entries.slice(-30).map((e) => e.id))) }
  function selectRandom30() { setSelectedIds(new Set(shuffle([...entries]).slice(0, 30).map((e) => e.id))) }
  function selectAll() { setSelectedIds(new Set(entries.map((e) => e.id))) }
  function selectStruggling30() {
    const attempted = entries
      .filter((e) => (stats[e.id]?.attempt_count ?? 0) > 0)
      .sort((a, b) => {
        const ra = stats[a.id]!.success_count / stats[a.id]!.attempt_count
        const rb = stats[b.id]!.success_count / stats[b.id]!.attempt_count
        return ra - rb
      })
      .slice(0, 30)
    const selected = new Set(attempted.map((e) => e.id))
    // Pad up to 30 with latest words not already included
    for (const e of entries) {
      if (selected.size >= 30) break
      if (!selected.has(e.id)) selected.add(e.id)
    }
    setSelectedIds(selected)
  }

  function toggleEntry(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function startSession(pool: DictionaryEntry[]) {
    const shuffled = shuffle(pool)
    setQueue(shuffled)
    setCurrentIndex(0)
    setStatuses(new Array(shuffled.length).fill('unanswered'))
    setShowGiveUpConfirm(false)
    setPhase('session')
  }

  const handleGotIt = useCallback(() => {
    const next = [...statuses]
    next[currentIndex] = 'got-it'
    setStatuses(next)
    if (next.every((s) => s !== 'unanswered')) {
      submitSession(buildResults(queue, next))
      setPhase('summary')
    } else {
      for (let i = 1; i < next.length; i++) {
        const candidate = (currentIndex + i) % next.length
        if (next[candidate] === 'unanswered') {
          setCurrentIndex(candidate)
          break
        }
      }
    }
  }, [currentIndex, statuses, queue, submitSession])

  const handleMissed = useCallback(() => {
    const next = [...statuses]
    next[currentIndex] = 'missed'
    setStatuses(next)
    if (next.every((s) => s !== 'unanswered')) {
      submitSession(buildResults(queue, next))
      setPhase('summary')
    } else {
      for (let i = 1; i < next.length; i++) {
        const candidate = (currentIndex + i) % next.length
        if (next[candidate] === 'unanswered') {
          setCurrentIndex(candidate)
          break
        }
      }
    }
  }, [currentIndex, statuses, queue, submitSession])

  function handleGiveUp() {
    const finalStatuses = statuses.map((s) => (s === 'unanswered' ? 'missed' : s))
    setStatuses(finalStatuses)
    submitSession(buildResults(queue, finalStatuses))
    setPhase('summary')
    setShowGiveUpConfirm(false)
  }

  // Setup screen
  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="mb-8 flex items-center gap-2">
          <CreditCard size={22} className="text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Flashcards</h1>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading dictionary…</p>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">No words in your dictionary yet.</p>
            <a href="/dictionary" className="mt-2 block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Add some words first
            </a>
          </div>
        ) : (
          <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            {/* Mode */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Quiz mode</label>
              <div className="grid grid-cols-2 gap-2">
                {(['jp-to-en', 'en-to-jp'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`rounded-lg border py-3 text-sm font-medium transition-colors ${
                      mode === m
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    {m === 'jp-to-en' ? 'Japanese → English' : 'English → Japanese'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by tag</label>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">All words ({entries.length})</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag} ({entries.filter((e) => e.tags.includes(tag)).length})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Word selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Select words</label>

              {/* Shortcuts */}
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  { label: 'Last 30', action: selectLast30 },
                  { label: 'First 30', action: selectFirst30 },
                  { label: 'Random 30', action: selectRandom30 },
                  { label: 'All', action: selectAll },
                  { label: 'Struggling 30', action: selectStruggling30 },
                  { label: 'Clear', action: () => setSelectedIds(new Set()) },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setWordListPage(1) }}
                  placeholder={mode === 'jp-to-en' ? 'Search Japanese…' : 'Search English…'}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>

              {/* Word list */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                {filteredEntries.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">No words match your search.</p>
                ) : (
                  pagedEntries.map((entry) => {
                    const checked = selectedIds.has(entry.id)
                    return (
                      <label
                        key={entry.id}
                        className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          checked
                            ? 'bg-indigo-50 dark:bg-indigo-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEntry(entry.id)}
                          className="h-3.5 w-3.5 rounded accent-indigo-600"
                        />
                        <span className={`flex-1 truncate ${checked ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {entry[displayKey]}
                        </span>
                        <StatBadge stat={stats[entry.id]} />
                      </label>
                    )
                  })
                )}
              </div>

              {/* Pagination */}
              {totalWordPages > 1 && (
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => setWordListPage((p) => Math.max(1, p - 1))}
                    disabled={clampedWordListPage === 1}
                    className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {clampedWordListPage} / {totalWordPages}
                  </span>
                  <button
                    onClick={() => setWordListPage((p) => Math.min(totalWordPages, p + 1))}
                    disabled={clampedWordListPage === totalWordPages}
                    className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
              <button
                onClick={() => startSession(selectedEntries)}
                disabled={selectedEntries.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Shuffle size={16} />
                Start session ({selectedEntries.length} word{selectedEntries.length !== 1 ? 's' : ''})
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Session screen
  if (phase === 'session') {
    const current = queue[currentIndex]

    return (
      <div className="mx-auto max-w-md px-4 py-10">
        {/* Status icon grid */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {statuses.map((status, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-all ${i === currentIndex ? 'ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-gray-950' : ''}`}
            >
              {status === 'got-it' ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : status === 'missed' ? (
                <XCircle size={16} className="text-red-400" />
              ) : (
                <Circle size={16} className="text-gray-300 dark:text-gray-600" />
              )}
            </button>
          ))}
        </div>

        {/* Hint + restart */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Answer all cards to finish, or give up to end early.
          </p>
          <button
            onClick={() => setPhase('setup')}
            className="flex shrink-0 items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <RotateCcw size={11} />
            <span>Restart</span>
          </button>
        </div>

        <FlashcardCard
          key={currentIndex}
          entry={current}
          mode={mode}
          onGotIt={handleGotIt}
          onMissed={handleMissed}
          isAnswered={statuses[currentIndex] !== 'unanswered'}
        />

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((i) => (i - 1 + queue.length) % queue.length)}
            className="rounded-xl border border-gray-200 bg-white p-3 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-xs text-gray-400 dark:text-gray-500">
            {currentIndex + 1} / {queue.length}
          </span>

          <button
            onClick={() => setCurrentIndex((i) => (i + 1) % queue.length)}
            className="rounded-xl border border-gray-200 bg-white p-3 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Give Up */}
        <div className="mt-4 text-center">
          {showGiveUpConfirm ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-900/20">
              <span className="text-center text-xs text-orange-700 dark:text-orange-300">
                End session? Unanswered cards count as missed.
              </span>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowGiveUpConfirm(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGiveUp}
                  className="text-xs font-medium text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowGiveUpConfirm(true)}
              className="text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              Give up
            </button>
          )}
        </div>
      </div>
    )
  }

  // Summary screen
  const gotItEntries = queue.filter((_, i) => statuses[i] === 'got-it')
  const missedEntries = queue.filter((_, i) => statuses[i] === 'missed')
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h2 className="mb-8 text-center text-xl font-bold text-gray-900 dark:text-gray-100">Session Complete</h2>
      <SessionSummary
        gotIt={gotItEntries}
        missed={missedEntries}
        stats={stats}
        onRetryMissed={() => startSession(missedEntries)}
        onStartOver={() => setPhase('setup')}
      />
    </div>
  )
}
