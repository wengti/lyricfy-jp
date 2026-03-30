'use client'

import { useState, useCallback } from 'react'
import { CreditCard, Shuffle } from 'lucide-react'
import { useDictionary } from '@/hooks/useDictionary'
import FlashcardCard from '@/components/flashcards/FlashcardCard'
import SessionSummary from '@/components/flashcards/SessionSummary'
import type { DictionaryEntry, DictionarySortOption } from '@/types/database'

type Mode = 'jp-to-en' | 'en-to-jp'
type Phase = 'setup' | 'session' | 'summary'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlashcardsPage() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [mode, setMode] = useState<Mode>('jp-to-en')
  const [tagFilter, setTagFilter] = useState('')
  const [queue, setQueue] = useState<DictionaryEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gotIt, setGotIt] = useState<DictionaryEntry[]>([])
  const [missed, setMissed] = useState<DictionaryEntry[]>([])

  const { entries, loading } = useDictionary({ sort: 'created_at_desc', tag: tagFilter })
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort()

  function startSession(pool: DictionaryEntry[]) {
    const shuffled = shuffle(pool)
    setQueue(shuffled)
    setCurrentIndex(0)
    setGotIt([])
    setMissed([])
    setPhase('session')
  }

  const handleGotIt = useCallback(() => {
    setGotIt((prev) => [...prev, queue[currentIndex]])
    if (currentIndex + 1 >= queue.length) {
      setPhase('summary')
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }, [currentIndex, queue])

  const handleMissed = useCallback(() => {
    setMissed((prev) => [...prev, queue[currentIndex]])
    if (currentIndex + 1 >= queue.length) {
      setPhase('summary')
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }, [currentIndex, queue])

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
                    onClick={() => setMode(m)}
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

            <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                {entries.length} word{entries.length !== 1 ? 's' : ''} will be included
              </p>
              <button
                onClick={() => startSession(entries)}
                disabled={entries.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Shuffle size={16} />
                Start session
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
    const progress = ((currentIndex) / queue.length) * 100

    return (
      <div className="mx-auto max-w-md px-4 py-10">
        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{currentIndex + 1} / {queue.length}</span>
            <span>{gotIt.length} correct, {missed.length} missed</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <FlashcardCard
          entry={current}
          mode={mode}
          onGotIt={handleGotIt}
          onMissed={handleMissed}
        />
      </div>
    )
  }

  // Summary screen
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h2 className="mb-8 text-center text-xl font-bold text-gray-900 dark:text-gray-100">Session Complete</h2>
      <SessionSummary
        gotIt={gotIt}
        missed={missed}
        onRetryMissed={() => startSession(missed)}
        onStartOver={() => setPhase('setup')}
      />
    </div>
  )
}
