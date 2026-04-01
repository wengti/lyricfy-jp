'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { DictionaryEntryInsert } from '@/types/database'
import type { FuriganaToken } from '@/types/ai'
import ExampleFuriganaEditor from './ExampleFuriganaEditor'

interface Props {
  onClose: () => void
  onSave: (entry: DictionaryEntryInsert) => Promise<unknown>
  prefill?: Partial<DictionaryEntryInsert>
}

const EMPTY: DictionaryEntryInsert = {
  japanese_text: '',
  hiragana: '',
  english_translation: '',
  example_japanese: '',
  example_furigana: null,
  example_english: '',
  source_song: '',
  source_artist: '',
  source_lyrics_line: '',
  tags: [],
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-indigo-800'

export default function AddWordModal({ onClose, onSave, prefill }: Props) {
  const [form, setForm] = useState<DictionaryEntryInsert>({ ...EMPTY, ...prefill })
  const [tagInput, setTagInput] = useState('')
  const [enriching, setEnriching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof DictionaryEntryInsert, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleEnrich() {
    if (!form.japanese_text) return
    setEnriching(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/enrich-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: form.japanese_text }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Enrichment failed')
      }
      const data = await res.json()
      setForm((f) => ({
        ...f,
        hiragana: data.hiragana ?? f.hiragana,
        english_translation: data.english_translation ?? f.english_translation,
        example_japanese: data.example_japanese ?? f.example_japanese,
        example_furigana: null,
        example_english: data.example_english ?? f.example_english,
      }))
      // Auto-annotate the generated example sentence
      if (data.example_japanese) {
        try {
          const aRes = await fetch('/api/ai/annotate-example', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.example_japanese }),
          })
          if (aRes.ok) {
            const furigana = (await aRes.json()).furigana ?? null
            setForm((f) => ({ ...f, example_furigana: furigana }))
          }
        } catch { /* non-fatal */ }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enrichment failed')
    } finally {
      setEnriching(false)
    }
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !(form.tags ?? []).includes(t)) {
      setForm((f) => ({ ...f, tags: [...(f.tags ?? []), t] }))
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: (f.tags ?? []).filter((t) => t !== tag) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Add word</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>
          )}

          {/* Japanese + Enrich button */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Japanese word / phrase <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                required
                value={form.japanese_text}
                onChange={(e) => set('japanese_text', e.target.value)}
                onBlur={handleEnrich}
                className={`flex-1 ${inputCls}`}
                placeholder="例：桜"
              />
              <button
                type="button"
                onClick={handleEnrich}
                disabled={enriching || !form.japanese_text}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {enriching ? <Loader2 size={14} className="animate-spin" /> : null}
                {enriching ? 'Enriching…' : 'AI enrich'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hiragana <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.hiragana}
                onChange={(e) => set('hiragana', e.target.value)}
                className={inputCls}
                placeholder="さくら"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                English <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.english_translation}
                onChange={(e) => set('english_translation', e.target.value)}
                className={inputCls}
                placeholder="cherry blossom"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Example sentence (JP)
            </label>
            <ExampleFuriganaEditor
              text={form.example_japanese ?? ''}
              tokens={(form.example_furigana as FuriganaToken[] | null | undefined) ?? null}
              onTextChange={(text) => setForm((f) => ({ ...f, example_japanese: text, example_furigana: null }))}
              onTokensChange={(tokens) => setForm((f) => ({ ...f, example_furigana: tokens }))}
              textareaClassName={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Example sentence (EN)
            </label>
            <input
              value={form.example_english ?? ''}
              onChange={(e) => set('example_english', e.target.value)}
              className={inputCls}
              placeholder="The cherry blossoms are blooming."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                className={`flex-1 ${inputCls}`}
                placeholder="Press Enter to add tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Add
              </button>
            </div>
            {(form.tags ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(form.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-full hover:text-indigo-900 dark:hover:text-indigo-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save word
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
