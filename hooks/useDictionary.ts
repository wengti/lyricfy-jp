'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DictionaryEntry, DictionaryEntryInsert, DictionarySortOption } from '@/types/database'

interface UseDictionaryOptions {
  sort?: DictionarySortOption
  search?: string
  tag?: string
}

export function useDictionary(options: UseDictionaryOptions = {}) {
  const { sort = 'created_at_desc', search = '', tag = '' } = options

  const [entries, setEntries] = useState<DictionaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ sort })
      if (search) params.set('search', search)
      if (tag) params.set('tag', tag)

      const res = await fetch(`/api/dictionary?${params}`)
      if (!res.ok) throw new Error('Failed to fetch entries')
      const data = await res.json()
      setEntries(data.entries)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [sort, search, tag])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  async function addEntry(entry: DictionaryEntryInsert): Promise<DictionaryEntry> {
    const res = await fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Failed to add entry')
    }
    const data = await res.json()
    if (!data.skipped) {
      setEntries((prev) => [data.entry, ...prev])
    }
    return data.entry
  }

  async function updateEntry(
    id: string,
    updates: Partial<DictionaryEntryInsert>
  ): Promise<DictionaryEntry> {
    const res = await fetch(`/api/dictionary/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Failed to update entry')
    }
    const data = await res.json()
    setEntries((prev) => prev.map((e) => (e.id === id ? data.entry : e)))
    return data.entry
  }

  async function deleteEntry(id: string): Promise<void> {
    const res = await fetch(`/api/dictionary/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete entry')
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return { entries, loading, error, addEntry, updateEntry, deleteEntry, refetch: fetchEntries }
}
