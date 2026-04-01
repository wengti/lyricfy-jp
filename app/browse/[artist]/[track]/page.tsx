import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLyricsFromLrclib } from '@/lib/lrclib/client'
import BrowseDetailClient from './BrowseDetailClient'
import type { Metadata } from 'next'
import type { LrcLine, TranslatedLine } from '@/types/ai'

interface CacheEntry {
  linesHash: string
  lines: TranslatedLine[]
  source?: 'manual' | 'manual-romaji' | 'lrclib' | 'lrclib-romaji'
  timestamps?: number[]
  synced?: boolean
}

type Params = Promise<{ artist: string; track: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { artist, track } = await params
  return {
    title: `${decodeURIComponent(track)} — ${decodeURIComponent(artist)} | LyricfyJP`,
  }
}

export default async function BrowseDetailPage({ params }: { params: Params }) {
  const { artist: artistParam, track: trackParam } = await params
  const trackName = decodeURIComponent(trackParam)
  const artist = decodeURIComponent(artistParam)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('lyrics_cache')
    .select('translated_lines')
    .eq('track_name', trackName.toLowerCase().trim())
    .eq('artist', artist.toLowerCase().trim())
    .maybeSingle()

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/browse"
          className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          ← Browse
        </Link>
        <p className="text-sm text-gray-500 dark:text-gray-400">Lyrics not found.</p>
      </div>
    )
  }

  const raw = data.translated_lines as CacheEntry | TranslatedLine[]

  let translatedLines: TranslatedLine[]
  let timestamps: number[] | undefined
  let source: 'lrclib' | 'lrclib-romaji' | 'manual' | 'manual-romaji' | null
  let synced: boolean

  if (Array.isArray(raw)) {
    // Legacy plain-array format — manually pasted before source tracking
    translatedLines = raw
    timestamps = undefined
    source = null
    synced = false
  } else {
    translatedLines = raw.lines ?? []
    timestamps = raw.timestamps
    source = raw.source ?? null
    synced = raw.synced ?? false

    // For lrclib entries where synced was not stored (entries cached before the fix),
    // check lrclib to get the accurate synced status — same as the lyrics page does.
    if (source === 'lrclib' && raw.synced === undefined) {
      const lrclibResult = await getLyricsFromLrclib(trackName, artist)
      if (lrclibResult) {
        synced = lrclibResult.synced
      }
    }
  }

  const lines: LrcLine[] = translatedLines
    .map((line, i) => ({
      ms: timestamps?.[i] ?? 0,
      text: line.tokens.length > 0
        ? line.tokens.map((t) => t.original).join('')
        : line.translation,
    }))
    .filter((l) => l.text.trim())

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/browse"
        className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        ← Browse
      </Link>

      {/* Track header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{trackName}</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{artist}</p>
      </div>

      <BrowseDetailClient
        lines={lines}
        translatedLines={translatedLines}
        source={source}
        synced={synced}
        trackName={trackName}
        artist={artist}
      />
    </div>
  )
}
