import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateSchema = z.object({
  japanese_text: z.string().min(1).max(200).optional(),
  hiragana: z.string().min(1).max(400).optional(),
  english_translation: z.string().min(1).max(500).optional(),
  example_japanese: z.string().max(500).nullable().optional(),
  example_furigana: z.array(z.object({ original: z.string(), reading: z.string().nullable() })).nullable().optional(),
  example_english: z.string().max(500).nullable().optional(),
  source_song: z.string().max(200).nullable().optional(),
  source_artist: z.string().max(200).nullable().optional(),
  source_lyrics_line: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('dictionary_entries')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id) // RLS + explicit owner check
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ entry: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('dictionary_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
