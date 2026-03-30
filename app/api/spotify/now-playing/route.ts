import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken, getNowPlaying } from '@/lib/spotify/api'
import type { NowPlayingState } from '@/types/spotify'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessToken = await getValidAccessToken(user.id)
  if (!accessToken) {
    return NextResponse.json({ connected: false })
  }

  try {
    const nowPlaying = await getNowPlaying(accessToken)

    if (!nowPlaying || !nowPlaying.item) {
      return NextResponse.json({ connected: true, playing: null })
    }

    const state: NowPlayingState = {
      isPlaying: nowPlaying.is_playing,
      progressMs: nowPlaying.progress_ms,
      track: {
        id: nowPlaying.item.id,
        name: nowPlaying.item.name,
        artist: nowPlaying.item.artists.map((a) => a.name).join(', '),
        albumArt: nowPlaying.item.album.images[0]?.url ?? null,
        durationMs: nowPlaying.item.duration_ms,
      },
    }

    return NextResponse.json({ connected: true, playing: state })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
