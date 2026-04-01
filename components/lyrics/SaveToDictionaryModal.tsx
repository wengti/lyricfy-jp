'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { DictionaryEntryInsert } from '@/types/database'
import type { BreakdownWord } from '@/types/ai'

interface BreakdownItem extends BreakdownWord {
  selected: boolean
}

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
  // Single-word mode state
  const [hiragana, setHiragana] = useState('')
  const [english, setEnglish] = useState('')
  const [exampleJapanese, setExampleJapanese] = useState('')
  const [exampleEnglish, setExampleEnglish] = useState('')
  const [enriching, setEnriching] = useState(false)
  const [enriched, setEnriched] = useState(false)

  // Breakdown mode state
  const [mode, setMode] = useState<'single' | 'breakdown'>('single')
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const [breakdownItems, setBreakdownItems] = useState<BreakdownItem[]>([])

  // Shared
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setExampleJapanese(data.example_japanese ?? '')
      setExampleEnglish(data.example_english ?? '')
      setEnriched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enrichment failed')
    } finally {
      setEnriching(false)
    }
  }

  async function handleBreakdown() {
    setBreakdownLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/breakdown-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Breakdown failed')
      }
      const data = await res.json()
      setBreakdownItems((data.words as BreakdownWord[]).map((w) => ({ ...w, selected: true })))
      setMode('breakdown')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Breakdown failed')
    } finally {
      setBreakdownLoading(false)
    }
  }

  function updateItem(index: number, field: keyof BreakdownWord, value: string) {
    setBreakdownItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function toggleItem(index: number) {
    setBreakdownItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    )
  }

  async function handleSaveSingle(e: React.FormEvent) {
    e.preventDefault()
    if (!hiragana || !english) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        japanese_text: phrase,
        hiragana,
        english_translation: english,
        example_japanese: exampleJapanese || null,
        example_english: exampleEnglish || null,
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

  async function handleSaveBreakdown() {
    const selected = breakdownItems.filter((item) => item.selected)
    if (selected.length === 0) return
    setSaving(true)
    setError(null)
    try {
      for (const item of selected) {
        await onSave({
          japanese_text: item.word,
          hiragana: item.hiragana,
          english_translation: item.english_translation,
          example_japanese: item.example_japanese || null,
          example_english: item.example_english || null,
          source_song: sourceSong ?? null,
          source_artist: sourceArtist ?? null,
          source_lyrics_line: sourceLyricsLine ?? null,
          tags: [],
        })
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = breakdownItems.filter((i) => i.selected).length

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-800'

  const cardInputClass =
    'w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-800'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Save to Dictionary</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {mode === 'single' ? (
          /* ── Single-word form ── */
          <form onSubmit={handleSaveSingle} className="space-y-4 px-6 py-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Selected phrase */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phrase</label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {phrase}
              </div>
            </div>

            {/* AI action buttons */}
            <div className="flex gap-2">
              {!enriched && (
                <button
                  type="button"
                  onClick={handleEnrich}
                  disabled={enriching || breakdownLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                >
                  {enriching && <Loader2 size={14} className="animate-spin" />}
                  {enriching ? 'Looking up…' : 'Auto-fill with AI'}
                </button>
              )}
              <button
                type="button"
                onClick={handleBreakdown}
                disabled={enriching || breakdownLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-60 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
              >
                {breakdownLoading && <Loader2 size={14} className="animate-spin" />}
                {breakdownLoading ? 'Analyzing…' : 'Break down phrase'}
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hiragana <span className="text-red-500">*</span>
              </label>
              <input required value={hiragana} onChange={(e) => setHiragana(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                English <span className="text-red-500">*</span>
              </label>
              <input required value={english} onChange={(e) => setEnglish(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Example sentence (Japanese)
              </label>
              <textarea
                rows={2}
                value={exampleJapanese}
                onChange={(e) => setExampleJapanese(e.target.value)}
                placeholder="例文..."
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Example sentence (English)
              </label>
              <textarea
                rows={2}
                value={exampleEnglish}
                onChange={(e) => setExampleEnglish(e.target.value)}
                placeholder="Translation of the example..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {sourceSong && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                From: <em>{sourceSong}</em>
                {sourceArtist && ` — ${sourceArtist}`}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
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
        ) : (
          /* ── Breakdown review ── */
          <div className="flex flex-col px-6 py-5">
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              AI found <strong>{breakdownItems.length}</strong> vocab in this phrase. Select which to save — all fields are editable.
            </p>

            {/* Scrollable card list */}
            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {breakdownItems.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 transition-colors ${
                    item.selected
                      ? 'border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleItem(i)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 accent-violet-600"
                    />
                    <div className="flex-1 space-y-2">
                      {/* Word + hiragana row */}
                      <div className="flex gap-2">
                        <input
                          value={item.word}
                          onChange={(e) => updateItem(i, 'word', e.target.value)}
                          className={`${cardInputClass} w-28 font-medium`}
                          placeholder="Word"
                        />
                        <input
                          value={item.hiragana}
                          onChange={(e) => updateItem(i, 'hiragana', e.target.value)}
                          className={`${cardInputClass} flex-1`}
                          placeholder="ひらがな"
                        />
                      </div>
                      {/* English */}
                      <input
                        value={item.english_translation}
                        onChange={(e) => updateItem(i, 'english_translation', e.target.value)}
                        className={cardInputClass}
                        placeholder="English meaning"
                      />
                      {/* Example JP */}
                      <textarea
                        rows={2}
                        value={item.example_japanese}
                        onChange={(e) => updateItem(i, 'example_japanese', e.target.value)}
                        placeholder="例文..."
                        className={`${cardInputClass} resize-none`}
                      />
                      {/* Example EN */}
                      <textarea
                        rows={2}
                        value={item.example_english}
                        onChange={(e) => updateItem(i, 'example_english', e.target.value)}
                        placeholder="Example translation..."
                        className={`${cardInputClass} resize-none`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between border-t pt-4 dark:border-gray-700">
              <button
                type="button"
                onClick={() => { setMode('single'); setError(null) }}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Back
              </button>
              {sourceSong && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  From: <em>{sourceSong}</em>
                </p>
              )}
              <button
                type="button"
                onClick={handleSaveBreakdown}
                disabled={saving || selectedCount === 0}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save {selectedCount > 0 ? `(${selectedCount})` : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
