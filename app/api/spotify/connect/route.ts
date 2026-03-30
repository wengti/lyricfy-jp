import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiKey } from '@/lib/getUserApiKeys'
import { buildSpotifyAuthUrl } from '@/lib/spotify/auth'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let clientId: string
  try {
    clientId = await requireApiKey('spotify_client_id', 'Spotify Client ID')
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`
  const url = buildSpotifyAuthUrl(clientId, redirectUri)
  return NextResponse.redirect(url)
}
