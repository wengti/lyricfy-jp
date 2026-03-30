import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { exchangeCodeForTokens } from '@/lib/spotify/auth'

function verifyState(state: string): string | null {
  try {
    const raw = Buffer.from(state, 'base64url').toString()
    const parts = raw.split('|')
    if (parts.length !== 3) return null
    const [userId, ts, sig] = parts
    if (Date.now() - Number(ts) > 600_000) return null // 10 min expiry
    const expected = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
      .update(`${userId}|${ts}`)
      .digest('hex')
    return sig === expected ? userId : null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/lyrics?spotify_error=${error ?? 'no_code'}`)
  }

  const userId = state ? verifyState(state) : null
  if (!userId) {
    return NextResponse.redirect(`${origin}/lyrics?spotify_error=invalid_state`)
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/lyrics?spotify_error=server_not_configured`)
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`

  try {
    const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const supabase = createAdminClient()
    await supabase.from('spotify_tokens').upsert(
      {
        user_id: userId,
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
