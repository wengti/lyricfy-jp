'use client'

import { useEffect, useRef } from 'react'
import RubyText from './RubyText'
import type { TranslatedLine } from '@/types/ai'

interface Props {
  line: TranslatedLine | null
  rawText: string
  isActive: boolean
  showTranslation: boolean
}

export default function LyricsLine({ line, rawText, isActive, showTranslation }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isActive])

  return (
    <div
      ref={ref}
      className={`rounded-xl px-4 py-2 transition-all duration-300 ${
        isActive
          ? 'bg-indigo-50 text-indigo-900 shadow-sm'
          : 'text-gray-500'
      }`}
    >
      <p className={`text-lg leading-relaxed ${isActive ? 'font-medium' : ''}`}>
        {line ? <RubyText tokens={line.tokens} /> : rawText}
      </p>
      {showTranslation && line?.translation && (
        <p className="mt-0.5 text-sm text-gray-400 italic">{line.translation}</p>
      )}
    </div>
  )
}
