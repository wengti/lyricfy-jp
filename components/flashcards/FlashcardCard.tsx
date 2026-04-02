'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import type { DictionaryEntry } from '@/types/database'
import RubyText from '@/components/lyrics/RubyText'

interface Props {
  entry: DictionaryEntry
  mode: 'jp-to-en' | 'en-to-jp'
  onGotIt: () => void
  onMissed: () => void
  isAnswered?: boolean
}

export default function FlashcardCard({ entry, mode, onGotIt, onMissed, isAnswered = false }: Props) {
  const [flipped, setFlipped] = useState(false)

  const front = mode === 'jp-to-en' ? entry.japanese_text : entry.english_translation
  const back = mode === 'jp-to-en' ? entry.english_translation : entry.japanese_text
  const backSub = mode === 'en-to-jp' ? entry.hiragana : undefined
  const backOriginal = mode === 'jp-to-en' ? entry.japanese_text : undefined
  const backFurigana = mode === 'jp-to-en' ? entry.hiragana : undefined
  const backEnglish = mode === 'en-to-jp' ? entry.english_translation : undefined

  function handleFlip() {
    setFlipped((f) => !f)
  }

  return (
    <div
      className="relative h-72 w-full max-w-sm cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={handleFlip}
    >
      <div
        className="relative h-full w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="px-6 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{front}</p>
          {!flipped && (
            <p className="mt-6 text-xs text-gray-300 dark:text-gray-600">Tap to reveal</p>
          )}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center rounded-2xl border border-indigo-100 bg-indigo-50 shadow-md dark:border-indigo-800 dark:bg-indigo-900/30"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* Answer content */}
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            {backEnglish && <p className="mb-2 text-sm text-indigo-400 dark:text-indigo-500">{backEnglish}</p>}
            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{back}</p>
            {backSub && <p className="mt-2 text-base text-indigo-400 dark:text-indigo-400">{backSub}</p>}
            {backOriginal && (
              <div className="mt-3 text-center">
                <p className="text-base font-medium text-indigo-700 dark:text-indigo-300">{backOriginal}</p>
                {backFurigana && <p className="mt-0.5 text-sm text-indigo-400 dark:text-indigo-500">{backFurigana}</p>}
              </div>
            )}
            {entry.example_japanese && (
              <div className="mt-3 text-center">
                <p className="flashcard-example text-base text-indigo-700 dark:text-indigo-300">
                  {entry.example_furigana
                    ? <RubyText tokens={entry.example_furigana} />
                    : entry.example_japanese}
                </p>
                <p className="text-xs text-indigo-400 dark:text-indigo-500">{entry.example_english}</p>
              </div>
            )}
          </div>

          {/* Action buttons pinned to bottom */}
          <div
            className="flex w-full justify-center gap-3 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            {isAnswered ? (
              <p className="text-xs text-indigo-300 dark:text-indigo-600">Already answered</p>
            ) : (
              <>
                <button
                  onClick={onMissed}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
                >
                  <XCircle size={13} />
                  Missed
                </button>
                <button
                  onClick={onGotIt}
                  className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/40 dark:text-green-400 dark:hover:bg-green-900/60"
                >
                  <CheckCircle size={13} />
                  Got it!
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
