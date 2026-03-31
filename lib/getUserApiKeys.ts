import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

export type UserApiKeys = {
  openrouter_api_key: string | null
}

/**
 * Fetches the current authenticated user's API keys via RLS.
 * Returns null if unauthenticated or no row exists yet.
 * Only call from server-side code (Route Handlers, Server Components).
 */
export async function getUserApiKeys(): Promise<UserApiKeys | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('openrouter_api_key')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch API keys: ${error.message}`)
  if (!data) return null
  return {
    openrouter_api_key: data.openrouter_api_key ? decrypt(data.openrouter_api_key) : null,
  }
}

/**
 * Fetches a specific API key or throws a user-friendly error.
 * Use in API routes — returns HTTP 422-ready message if key is missing.
 */
export async function requireApiKey(
  field: keyof UserApiKeys,
  friendlyName: string
): Promise<string> {
  const keys = await getUserApiKeys()
  const value = keys?.[field]
  if (!value) {
    throw new Error(
      `No ${friendlyName} configured. Please add it in Settings (/settings).`
    )
  }
  return value
}
