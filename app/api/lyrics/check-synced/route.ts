import { NextResponse } from 'next/server'
import { getLyricsFromLrclib } from '@/lib/lrclib/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const track = searchParams.get('track')
  const artist = searchParams.get('artist')

  if (!track || !artist) {
    return NextResponse.json({ error: 'track and artist are required' }, { status: 400 })
  }

  const result = await getLyricsFromLrclib(track, artist)

  if (result?.synced) {
    return NextResponse.json({ hasSynced: true, lines: result.lines })
  }

  return NextResponse.json({ hasSynced: false })
}
