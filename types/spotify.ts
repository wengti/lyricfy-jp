export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string; width: number; height: number }[]
  }
  duration_ms: number
}

export interface NowPlayingResponse {
  is_playing: boolean
  progress_ms: number
  item: SpotifyTrack | null
}

export interface NowPlayingState {
  isPlaying: boolean
  progressMs: number
  track: {
    id: string
    name: string
    artist: string
    albumArt: string | null
    durationMs: number
  } | null
}
