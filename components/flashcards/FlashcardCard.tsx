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
  const frontSub = mode === 'jp-to-en' ? entry.hiragana : undefined
  const back = mode === 'jp-to-en' ? entry.english_translation : entry.japanese_text
  const backSub = mode === 'en-to-jp' ? entry.hiragana : undefined

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
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-md"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-3xl font-bold text-gray-900">{front}</p>
            {frontSub && <p className="mt-2 text-base text-gray-400">{frontSub}</p>}
            {!flipped && (
              <p className="mt-6 text-xs text-gray-300">Tap to reveal</p>
            )}
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 shadow-md"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-2xl font-bold text-indigo-900">{back}</p>
            {backSub && <p className="mt-2 text-base text-indigo-400">{backSub}</p>}
            {entry.example_japanese && (
              <div className="mt-4 px-6 text-center">
                <p className="text-sm text-indigo-700">{entry.example_japanese}</p>
                <p className="text-xs text-indigo-400">{entry.example_english}</p>
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
            className="rounded-xl border border-red-200 bg-red-50 px-8 py-3 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            Missed
          </button>
          <button
            onClick={onGotIt}
            className="rounded-xl border border-green-200 bg-green-50 px-8 py-3 text-sm font-medium text-green-700 hover:bg-green-100"
          >
            Got it!
          </button>
        </div>
      )}
    </div>
  )
}
