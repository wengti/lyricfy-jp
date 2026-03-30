import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { buildSpotifyAuthUrl } from '@/lib/spotify/auth'

function buildState(userId: string): string {
  const ts = Date.now().toString()
  const payload = `${userId}|${ts}`
  const sig = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(payload)
    .digest('hex')
  return Buffer.from(`${payload}|${sig}`).toString('base64url')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.SPOTIFY_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Spotify is not configured on this server.' }, { status: 503 })
  }

  const state = buildState(user.id)
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`
  const url = buildSpotifyAuthUrl(clientId, redirectUri, state)
  return NextResponse.redirect(url)
}
