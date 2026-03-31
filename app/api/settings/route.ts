import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { maskKey } from '@/lib/maskKey'
import { encrypt, decrypt } from '@/lib/encryption'
import { z } from 'zod'

const updateSchema = z.object({
  openrouter_api_key: z.string().max(512).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('openrouter_api_key, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ keys: null })

  return NextResponse.json({
    keys: {
      openrouter_api_key: maskKey(data.openrouter_api_key ? decrypt(data.openrouter_api_key) : null),
      updated_at: data.updated_at,
    },
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Only include non-empty fields — empty string = "don't overwrite"
  // Encrypt each value before storing so plaintext never lands in the DB.
  const payload: Record<string, string> = {}
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v && v.trim() !== '') payload[k] = encrypt(v.trim())
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ success: true, message: 'No changes' })
  }

  const { error } = await supabase
    .from('user_api_keys')
    .upsert({ user_id: user.id, ...payload }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
