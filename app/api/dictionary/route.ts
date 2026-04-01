import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { DictionarySortOption } from '@/types/database'

const SORT_MAP: Record<DictionarySortOption, string> = {
  created_at_desc: 'created_at',
  created_at_asc: 'created_at',
  japanese_asc: 'japanese_text',
  english_asc: 'english_translation',
}

const insertSchema = z.object({
  japanese_text: z.string().min(1).max(200),
  hiragana: z.string().min(1).max(400),
  english_translation: z.string().min(1).max(500),
  example_japanese: z.string().max(500).optional().nullable(),
  example_english: z.string().max(500).optional().nullable(),
  source_song: z.string().max(200).optional().nullable(),
  source_artist: z.string().max(200).optional().nullable(),
  source_lyrics_line: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sort = (searchParams.get('sort') ?? 'created_at_desc') as DictionarySortOption
  const search = searchParams.get('search') ?? ''
  const tag = searchParams.get('tag') ?? ''
  const ascending = sort === 'created_at_asc' || sort.endsWith('_asc')

  let query = supabase
    .from('dictionary_entries')
    .select('*')
    .eq('user_id', user.id)
    .order(SORT_MAP[sort] ?? 'created_at', { ascending })

  if (search) {
    query = query.or(
      `japanese_text.ilike.%${search}%,hiragana.ilike.%${search}%,english_translation.ilike.%${search}%`
    )
  }
  if (tag) {
    query = query.contains('tags', [tag])
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = insertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join(', ') }, { status: 422 })
  }

  const { data: existing } = await supabase
    .from('dictionary_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('japanese_text', parsed.data.japanese_text)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ entry: existing, skipped: true }, { status: 200 })
  }

  const { data, error } = await supabase
    .from('dictionary_entries')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data, skipped: false }, { status: 201 })
}
