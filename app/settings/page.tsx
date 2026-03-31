import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { maskKey } from '@/lib/maskKey'
import { decrypt } from '@/lib/encryption'
import SettingsForm from './SettingsForm'

export const metadata = { title: 'Settings — LyricfyJP' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('user_api_keys')
    .select('openrouter_api_key, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  const savedKeys = data
    ? {
        openrouter_api_key: maskKey(data.openrouter_api_key ? decrypt(data.openrouter_api_key) : null),
        updated_at: data.updated_at,
      }
    : null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const provider = user.app_metadata?.provider ?? 'email'
  const providerLabel =
    provider === 'google' ? 'Google' :
    provider === 'github' ? 'GitHub' :
    'Email & Password'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Account info */}
      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Account</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Email</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Sign-in method</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{providerLabel}</dd>
          </div>
        </dl>
      </section>

      <SettingsForm savedKeys={savedKeys} appUrl={appUrl} />
    </div>
  )
}
