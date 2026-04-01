'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Library, Search } from 'lucide-react'

interface SearchResult {
  track_name: string
  artist: string
  source: string | null
}

function getSourceBadge(source: string | null) {
  if (!source || source === 'manual') {
    return { label: 'Manual', cls: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' }
  }
  if (source === 'lrclib' || source === 'lrclib-romaji') {
    return { label: 'lrclib.net', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800' }
  }
  return null
}

export default function BrowsePage() {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce query input by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debounced.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch(`/api/lyrics/search?q=${encodeURIComponent(debounced)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results ?? [])
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError('Search failed. Please try again.')
        setLoading(false)
      })

    return () => controller.abort()
  }, [debounced])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Library size={24} className="text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Browse Lyrics</h1>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by song, artist, or lyrics…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-indigo-500"
        />
      </div>

      {/* States */}
      {!debounced.trim() && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          Search for a song or artist…
        </p>
      )}

      {loading && (
        <p className="text-center text-sm text-gray-400 animate-pulse dark:text-gray-500">
          Searching…
        </p>
      )}

      {error && (
        <p className="text-center text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {!loading && !error && debounced.trim() && results.length === 0 && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          No songs found for &ldquo;{debounced}&rdquo;
        </p>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r) => {
            const badge = getSourceBadge(r.source)
            return (
              <li key={`${r.artist}/${r.track_name}`}>
                <Link
                  href={`/browse/${encodeURIComponent(r.artist)}/${encodeURIComponent(r.track_name)}`}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {r.track_name}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.artist}</p>
                  </div>
                  {badge && (
                    <span
                      className={`ml-3 shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
