'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, Plus, Minus, ShieldCheck, Users } from 'lucide-react'
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

interface Props {
  savedKeys: MaskedApiKeys | null
  appUrl: string
}

export default function SettingsForm({ savedKeys }: Props) {
  const [securityOpen, setSecurityOpen] = useState(false)
  const [cacheOpen, setCacheOpen] = useState(false)
  const [form, setForm] = useState({
    openrouter_api_key: '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [localSavedKeys, setLocalSavedKeys] = useState<MaskedApiKeys | null>(savedKeys)

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
      const refreshed = await fetch('/api/settings')
      if (refreshed.ok) {
        const { keys } = await refreshed.json()
        setLocalSavedKeys(keys)
      }
      setStatus('success')
      setForm({ openrouter_api_key: '' })
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Save failed')
      setStatus('error')
    }
  }

  const updatedAt = localSavedKeys?.updated_at
    ? new Date(localSavedKeys.updated_at).toLocaleDateString('en-US', {
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
          The <code className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-800 dark:text-gray-300">google/gemini-2.0-flash-001</code> model is used.
        </p>
        <TutorialAccordion service="OpenRouter" steps={OPENROUTER_STEPS} />

        {/* Security accordion */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={() => setSecurityOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-indigo-500" />
              How is my API key protected?
            </span>
            {securityOpen
              ? <Minus size={16} className="text-gray-400 dark:text-gray-500" />
              : <Plus size={16} className="text-gray-400 dark:text-gray-500" />
            }
          </button>
          <div className={`grid transition-all duration-200 ${securityOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="space-y-2 px-4 pb-4 pt-1 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Your key is encrypted with <strong className="text-gray-800 dark:text-gray-200">AES-256-GCM</strong> before
                  being written to the database. The encryption secret lives only in the server environment —
                  it is never stored in the database itself.
                </p>
                <p>
                  This means that even the app admin cannot read your key by looking at the database.
                  Your key is decrypted solely in server memory, and only at the moment it is needed to make an AI request on your behalf.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Shared cache accordion */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={() => setCacheOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <span className="flex items-center gap-2">
              <Users size={15} className="text-indigo-500" />
              Do I have to provide an API key?
            </span>
            {cacheOpen
              ? <Minus size={16} className="text-gray-400 dark:text-gray-500" />
              : <Plus size={16} className="text-gray-400 dark:text-gray-500" />
            }
          </button>
          <div className={`grid transition-all duration-200 ${cacheOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="space-y-2 px-4 pb-4 pt-1 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  No. When a song is translated, the result is stored in a <strong className="text-gray-800 dark:text-gray-200">shared cache</strong>.
                  Any user who plays the same song afterwards will see the cached furigana and translations instantly —
                  no API key required.
                </p>
                <p>
                  An API key is only needed to translate a song that <strong className="text-gray-800 dark:text-gray-200">no one has played before</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ApiKeyInput
          id="openrouter_api_key"
          label="API Key"
          value={form.openrouter_api_key}
          savedValue={localSavedKeys?.openrouter_api_key ?? null}
          onChange={(v) => setField('openrouter_api_key', v)}
          placeholder="sk-or-v1-..."
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
