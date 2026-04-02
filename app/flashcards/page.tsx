'use client'

import { useState, useCallback } from 'react'
import { CreditCard, Shuffle, RotateCcw, Circle, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDictionary } from '@/hooks/useDictionary'
import FlashcardCard from '@/components/flashcards/FlashcardCard'
import SessionSummary from '@/components/flashcards/SessionSummary'
import type { DictionaryEntry } from '@/types/database'

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

export default function FlashcardsPage() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [mode, setMode] = useState<Mode>('jp-to-en')
  const [tagFilter, setTagFilter] = useState('')
  const [queue, setQueue] = useState<DictionaryEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [statuses, setStatuses] = useState<CardStatus[]>([])
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false)

  const { entries, loading } = useDictionary({ sort: 'created_at_desc', tag: tagFilter })
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort()

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
  }, [currentIndex, statuses])

  const handleMissed = useCallback(() => {
    const next = [...statuses]
    next[currentIndex] = 'missed'
    setStatuses(next)
    if (next.every((s) => s !== 'unanswered')) {
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
  }, [currentIndex, statuses])

  function handleGiveUp() {
    setStatuses((prev) => prev.map((s) => (s === 'unanswered' ? 'missed' : s)))
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
            <div className="inline-flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 dark:border-orange-800 dark:bg-orange-900/20">
              <span className="text-xs text-orange-700 dark:text-orange-300">
                End session? Unanswered cards count as missed.
              </span>
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
        onRetryMissed={() => startSession(missedEntries)}
        onStartOver={() => setPhase('setup')}
      />
    </div>
  )
}
