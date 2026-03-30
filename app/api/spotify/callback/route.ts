import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserApiKeys } from '@/lib/getUserApiKeys'
import { exchangeCodeForTokens } from '@/lib/spotify/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/lyrics?spotify_error=${error ?? 'no_code'}`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/auth/login`)

  const keys = await getUserApiKeys()
  if (!keys?.spotify_client_id || !keys?.spotify_client_secret) {
    return NextResponse.redirect(`${origin}/settings?error=missing_spotify_keys`)
  }

  const redirectUri = `${origin}/api/spotify/callback`

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      keys.spotify_client_id,
      keys.spotify_client_secret,
      redirectUri
    )

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabase.from('spotify_tokens').upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      },
      { onConflict: 'user_id' }
    )

    return NextResponse.redirect(`${origin}/lyrics?spotify_connected=1`)
  } catch (e) {
    console.error('Spotify callback error:', e)
    return NextResponse.redirect(`${origin}/lyrics?spotify_error=token_exchange_failed`)
  }
}
