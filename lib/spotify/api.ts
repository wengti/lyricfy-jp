import { createClient } from '@/lib/supabase/server'
import { refreshAccessToken } from './auth'
import { getUserApiKeys } from '@/lib/getUserApiKeys'
import type { NowPlayingResponse } from '@/types/spotify'

const FIVE_MIN_MS = 5 * 60 * 1000

/**
 * Gets a valid Spotify access token for the current user.
 * Refreshes inline if it expires within 5 minutes.
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: tokenRow, error } = await supabase
    .from('spotify_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !tokenRow) return null

  const expiresAt = new Date(tokenRow.expires_at).getTime()
  const needsRefresh = Date.now() + FIVE_MIN_MS >= expiresAt

  if (!needsRefresh) return tokenRow.access_token

  // Refresh the token
  const keys = await getUserApiKeys()
  if (!keys?.spotify_client_id || !keys?.spotify_client_secret) return null

  const refreshed = await refreshAccessToken(
    tokenRow.refresh_token,
    keys.spotify_client_id,
    keys.spotify_client_secret
  )

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

  await supabase
    .from('spotify_tokens')
    .update({
      access_token: refreshed.access_token,
      expires_at: newExpiresAt,
      ...(refreshed.refresh_token ? { refresh_token: refreshed.refresh_token } : {}),
    })
    .eq('user_id', userId)

  return refreshed.access_token
}

export async function getNowPlaying(accessToken: string): Promise<NowPlayingResponse | null> {
  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (res.status === 204 || res.status === 404) return null // Nothing playing
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`)

  return res.json()
}
