'use client'

import { useState } from 'react'
import type { DictionaryEntry } from '@/types/database'

interface Props {
  entry: DictionaryEntry
  mode: 'jp-to-en' | 'en-to-jp'
  onGotIt: () => void
  onMissed: () => void
}

export default function FlashcardCard({ entry, mode, onGotIt, onMissed }: Props) {
  const [flipped, setFlipped] = useState(false)

  const front = mode === 'jp-to-en' ? entry.japanese_text : entry.english_translation
  const back = mode === 'jp-to-en' ? entry.english_translation : entry.japanese_text
  const backSub = mode === 'en-to-jp' ? entry.hiragana : undefined
  const backOriginal = mode === 'jp-to-en' ? entry.japanese_text : undefined
  const backFurigana = mode === 'jp-to-en' ? entry.hiragana : undefined

  function handleFlip() {
    if (!flipped) setFlipped(true)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card with 3D flip */}
      <div
        className="relative h-64 w-full max-w-sm cursor-pointer"
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
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{front}</p>
            {!flipped && (
              <p className="mt-6 text-xs text-gray-300 dark:text-gray-600">Tap to reveal</p>
            )}
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 shadow-md dark:border-indigo-800 dark:bg-indigo-900/30"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{back}</p>
            {backSub && <p className="mt-2 text-base text-indigo-400 dark:text-indigo-400">{backSub}</p>}
            {backOriginal && (
              <div className="mt-3 text-center">
                <p className="text-base font-medium text-indigo-700 dark:text-indigo-300">{backOriginal}</p>
                {backFurigana && <p className="mt-0.5 text-sm text-indigo-400 dark:text-indigo-500">{backFurigana}</p>}
              </div>
            )}
            {entry.example_japanese && (
              <div className="mt-4 px-6 text-center">
                <p className="text-sm text-indigo-700 dark:text-indigo-300">{entry.example_japanese}</p>
                <p className="text-xs text-indigo-400 dark:text-indigo-500">{entry.example_english}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons — only shown after flip */}
      {flipped && (
        <div className="flex gap-4">
          <button
            onClick={onMissed}
            className="rounded-xl border border-red-200 bg-red-50 px-8 py-3 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            Missed
          </button>
          <button
            onClick={onGotIt}
            className="rounded-xl border border-green-200 bg-green-50 px-8 py-3 text-sm font-medium text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
          >
            Got it!
          </button>
        </div>
      )}
    </div>
  )
}
