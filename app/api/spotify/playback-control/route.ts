import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken } from '@/lib/spotify/api'

type Action = 'play' | 'pause' | 'next' | 'previous' | 'seek'

const SPOTIFY_PLAYER = 'https://api.spotify.com/v1/me/player'

const ACTION_MAP: Record<Exclude<Action, 'seek'>, { url: string; method: string }> = {
  play:     { url: `${SPOTIFY_PLAYER}/play`,     method: 'PUT'  },
  pause:    { url: `${SPOTIFY_PLAYER}/pause`,    method: 'PUT'  },
  next:     { url: `${SPOTIFY_PLAYER}/next`,     method: 'POST' },
  previous: { url: `${SPOTIFY_PLAYER}/previous`, method: 'POST' },
}

async function callSpotify(url: string, method: string, accessToken: string) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 403) return NextResponse.json({ error: 'insufficient_scope' }, { status: 403 })
  if (!res.ok && res.status !== 204) return NextResponse.json({ error: 'Spotify API error' }, { status: res.status })
  return NextResponse.json({ ok: true })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const action: Action = body.action

  const accessToken = await getValidAccessToken(user.id)
  if (!accessToken) return NextResponse.json({ error: 'Not connected to Spotify' }, { status: 401 })

  if (action === 'seek') {
    const position_ms = Number(body.position_ms)
    if (!Number.isFinite(position_ms) || position_ms < 0) {
      return NextResponse.json({ error: 'Invalid position_ms' }, { status: 400 })
    }
    return callSpotify(`${SPOTIFY_PLAYER}/seek?position_ms=${Math.round(position_ms)}`, 'PUT', accessToken)
  }

  if (!ACTION_MAP[action as Exclude<Action, 'seek'>]) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { url, method } = ACTION_MAP[action as Exclude<Action, 'seek'>]
  return callSpotify(url, method, accessToken)
}
