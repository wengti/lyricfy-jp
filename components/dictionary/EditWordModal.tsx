'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { DictionaryEntry, DictionaryEntryUpdate } from '@/types/database'
import type { FuriganaToken } from '@/types/ai'
import ExampleFuriganaEditor from './ExampleFuriganaEditor'

interface Props {
  entry: DictionaryEntry
  onClose: () => void
  onSave: (id: string, updates: DictionaryEntryUpdate) => Promise<unknown>
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-800'

export default function EditWordModal({ entry, onClose, onSave }: Props) {
  const [form, setForm] = useState<DictionaryEntryUpdate>({
    japanese_text: entry.japanese_text,
    hiragana: entry.hiragana,
    english_translation: entry.english_translation,
    example_japanese: entry.example_japanese ?? '',
    example_furigana: entry.example_furigana ?? null,
    example_english: entry.example_english ?? '',
    tags: [...entry.tags],
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof DictionaryEntryUpdate, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
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
      await onSave(entry.id, form)
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
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Edit word</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Japanese *</label>
            <input
              required
              value={form.japanese_text ?? ''}
              onChange={(e) => set('japanese_text', e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Hiragana *</label>
              <input
                required
                value={form.hiragana ?? ''}
                onChange={(e) => set('hiragana', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">English *</label>
              <input
                required
                value={form.english_translation ?? ''}
                onChange={(e) => set('english_translation', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Example (JP)</label>
            <ExampleFuriganaEditor
              text={form.example_japanese ?? ''}
              tokens={(form.example_furigana as FuriganaToken[] | null | undefined) ?? null}
              onTextChange={(text) => setForm((f) => ({ ...f, example_japanese: text, example_furigana: null }))}
              onTokensChange={(tokens) => setForm((f) => ({ ...f, example_furigana: tokens }))}
              skipInitialAnnotation
              textareaClassName={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Example (EN)</label>
            <input
              value={form.example_english ?? ''}
              onChange={(e) => set('example_english', e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                className={`flex-1 ${inputCls}`}
                placeholder="Press Enter to add tag"
              />
              <button type="button" onClick={addTag} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">Add</button>
            </div>
            {(form.tags ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(form.tags ?? []).map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 rounded-full hover:text-indigo-900 dark:hover:text-indigo-200">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
