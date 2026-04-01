import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken } from '@/lib/spotify/api'

type Action = 'play' | 'pause' | 'next' | 'previous'

const SPOTIFY_PLAYER = 'https://api.spotify.com/v1/me/player'

const ACTION_MAP: Record<Action, { url: string; method: string }> = {
  play:     { url: `${SPOTIFY_PLAYER}/play`,     method: 'PUT'  },
  pause:    { url: `${SPOTIFY_PLAYER}/pause`,    method: 'PUT'  },
  next:     { url: `${SPOTIFY_PLAYER}/next`,     method: 'POST' },
  previous: { url: `${SPOTIFY_PLAYER}/previous`, method: 'POST' },
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const action: Action = body.action
  if (!ACTION_MAP[action]) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const accessToken = await getValidAccessToken(user.id)
  if (!accessToken) {
    return NextResponse.json({ error: 'Not connected to Spotify' }, { status: 401 })
  }

  const { url, method } = ACTION_MAP[action]
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (res.status === 403) {
    return NextResponse.json({ error: 'insufficient_scope' }, { status: 403 })
  }

  if (!res.ok && res.status !== 204) {
    return NextResponse.json({ error: 'Spotify API error' }, { status: res.status })
  }

  return NextResponse.json({ ok: true })
}
