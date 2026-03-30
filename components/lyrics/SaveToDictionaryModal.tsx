'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { DictionaryEntryInsert } from '@/types/database'

interface Props {
  phrase: string
  sourceSong?: string
  sourceArtist?: string
  sourceLyricsLine?: string
  onClose: () => void
  onSave: (entry: DictionaryEntryInsert) => Promise<unknown>
}

export default function SaveToDictionaryModal({
  phrase,
  sourceSong,
  sourceArtist,
  sourceLyricsLine,
  onClose,
  onSave,
}: Props) {
  const [hiragana, setHiragana] = useState('')
  const [english, setEnglish] = useState('')
  const [enriching, setEnriching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enriched, setEnriched] = useState(false)

  async function handleEnrich() {
    setEnriching(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/enrich-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: phrase }),
      })
      if (!res.ok) throw new Error('Enrichment failed')
      const data = await res.json()
      setHiragana(data.hiragana ?? '')
      setEnglish(data.english_translation ?? '')
      setEnriched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enrichment failed')
    } finally {
      setEnriching(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!hiragana || !english) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        japanese_text: phrase,
        hiragana,
        english_translation: english,
        example_japanese: null,
        example_english: null,
        source_song: sourceSong ?? null,
        source_artist: sourceArtist ?? null,
        source_lyrics_line: sourceLyricsLine ?? null,
        tags: [],
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Save to Dictionary</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Selected phrase */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Phrase</label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800">
              {phrase}
            </div>
          </div>

          {/* AI Enrich button */}
          {!enriched && (
            <button
              type="button"
              onClick={handleEnrich}
              disabled={enriching}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
            >
              {enriching && <Loader2 size={14} className="animate-spin" />}
              {enriching ? 'Looking up…' : 'Auto-fill with AI'}
            </button>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Hiragana <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={hiragana}
              onChange={(e) => setHiragana(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              English <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {sourceSong && (
            <p className="text-xs text-gray-400">
              From: <em>{sourceSong}</em>
              {sourceArtist && ` — ${sourceArtist}`}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !hiragana || !english}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
