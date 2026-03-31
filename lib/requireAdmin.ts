import { createClient } from '@/lib/supabase/server'

/**
 * Verifies the current user is an admin.
 * Throws with a 403-ready message if unauthenticated or not an admin.
 * Only call from server-side code (Route Handlers, Server Components).
 */
export async function requireAdmin(): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new Error(`Failed to verify permissions: ${error.message}`)

  if (!data?.is_admin) {
    throw new Error('Admin access required.')
  }
}
