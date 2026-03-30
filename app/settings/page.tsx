import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { maskKey } from '@/lib/maskKey'
import SettingsForm from './SettingsForm'

export const metadata = { title: 'Settings — LyricfyJP' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('user_api_keys')
    .select('openrouter_api_key, genius_access_token, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  const savedKeys = data
    ? {
        openrouter_api_key: maskKey(data.openrouter_api_key),
        genius_access_token: maskKey(data.genius_access_token),
        updated_at: data.updated_at,
      }
    : null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Settings</h1>
      <SettingsForm savedKeys={savedKeys} appUrl={appUrl} />
    </div>
  )
}
