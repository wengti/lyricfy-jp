'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import ConfidentialityBanner from '@/components/settings/ConfidentialityBanner'
import ApiKeyInput from '@/components/settings/ApiKeyInput'
import TutorialAccordion from '@/components/settings/TutorialAccordion'
import type { MaskedApiKeys } from '@/types/settings'

const OPENROUTER_STEPS = [
  { heading: 'Go to openrouter.ai and create a free account or sign in.', body: null },
  { heading: 'Click your profile avatar in the top right, then select Keys.', body: null },
  { heading: 'Click Create Key. Give it a name (e.g. "LyricfyJP") and leave the credit limit blank.', body: null },
  { heading: 'Copy the key that appears — it starts with sk-or-. You cannot view it again after closing.', body: null },
  { heading: 'Paste the key into the field below and click Save.', body: null },
]

const GENIUS_STEPS = [
  { heading: 'Go to genius.com/api-clients and sign in or create a free account.', body: null },
  { heading: 'Click New API Client. Fill in any app name and homepage URL.', body: null },
  { heading: 'Click Generate Access Token. Copy the token and paste it below.', body: null },
]

interface Props {
  savedKeys: MaskedApiKeys | null
  appUrl: string
}

export default function SettingsForm({ savedKeys }: Props) {
  const [form, setForm] = useState({
    openrouter_api_key: '',
    genius_access_token: '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function setField(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Save failed')
      }
      setStatus('success')
      // Clear form fields after save — saved values are shown via placeholder
      setForm({ openrouter_api_key: '', genius_access_token: '' })
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Save failed')
      setStatus('error')
    }
  }

  const updatedAt = savedKeys?.updated_at
    ? new Date(savedKeys.updated_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <form onSubmit={handleSave} className="space-y-10">
      <ConfidentialityBanner />

      {/* OpenRouter */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">OpenRouter</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Used for AI furigana annotations, English translations, word enrichment, and romaji conversion.
          The free <code className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-800 dark:text-gray-300">google/gemma-3-27b-it:free</code> model is used.
        </p>
        <TutorialAccordion service="OpenRouter" steps={OPENROUTER_STEPS} />
        <ApiKeyInput
          id="openrouter_api_key"
          label="API Key"
          value={form.openrouter_api_key}
          savedValue={savedKeys?.openrouter_api_key ?? null}
          onChange={(v) => setField('openrouter_api_key', v)}
          placeholder="sk-or-v1-..."
        />
      </section>

      {/* Genius */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Genius</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Used as a fallback lyrics source when lrclib.net doesn&apos;t have a song. Free to use.
        </p>
        <TutorialAccordion service="Genius" steps={GENIUS_STEPS} />
        <ApiKeyInput
          id="genius_access_token"
          label="Access Token"
          value={form.genius_access_token}
          savedValue={savedKeys?.genius_access_token ?? null}
          onChange={(v) => setField('genius_access_token', v)}
          placeholder="Your Genius Access Token"
        />
      </section>

      {/* Save */}
      <div className="flex items-center gap-4 border-t border-gray-100 pt-6 dark:border-gray-800">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {status === 'saving' && <Loader2 size={15} className="animate-spin" />}
          {status === 'saving' ? 'Saving…' : 'Save all keys'}
        </button>

        {status === 'success' && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 size={15} />
            Keys saved successfully
          </span>
        )}
        {status === 'error' && errorMsg && (
          <span className="text-sm text-red-600 dark:text-red-400">{errorMsg}</span>
        )}
        {updatedAt && status === 'idle' && (
          <span className="text-xs text-gray-400 dark:text-gray-500">Last updated: {updatedAt}</span>
        )}
      </div>
    </form>
  )
}
