'use client'

import { useEffect, useRef } from 'react'
import RubyText from './RubyText'
import type { TranslatedLine } from '@/types/ai'

interface Props {
  line: TranslatedLine | null
  rawText: string
  isActive: boolean
  showTranslation: boolean
  autoScroll: boolean
}

export default function LyricsLine({ line, rawText, isActive, showTranslation, autoScroll }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive && autoScroll && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isActive, autoScroll])

  return (
    <div
      ref={ref}
      className={`rounded-xl px-4 py-2 transition-all duration-300 ${
        isActive
          ? 'bg-indigo-50 text-indigo-900 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-100'
          : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      <p className={`text-3xl sm:text-4xl leading-loose ${isActive ? 'font-medium' : ''}`}>
        {line && line.tokens.length > 0 ? <RubyText tokens={line.tokens} /> : rawText}
      </p>
      {showTranslation && line?.translation && (
        <p className="-mt-4 mb-4 text-[1.1em] text-gray-400 italic">{line.translation}</p>
      )}
    </div>
  )
}
