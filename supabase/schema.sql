-- ============================================================
-- Lyricfy-JP — Supabase Schema
-- Run this in the Supabase SQL editor to set up all tables.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- updated_at trigger function (shared by all tables)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- spotify_tokens
-- One row per user. Stores OAuth access + refresh tokens.
-- ============================================================
create table public.spotify_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade unique,
  access_token  text not null,
  refresh_token text not null,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.spotify_tokens enable row level security;

create policy "own spotify tokens" on public.spotify_tokens
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger trg_spotify_tokens_upd
  before update on public.spotify_tokens
  for each row execute function public.set_updated_at();

-- ============================================================
-- dictionary_entries
-- Personal vocabulary list per user.
-- ============================================================
create table public.dictionary_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  japanese_text       text not null,
  hiragana            text not null,
  english_translation text not null,
  example_japanese    text,
  example_english     text,
  source_song         text,
  source_artist       text,
  source_lyrics_line  text,
  tags                text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_dict_user_id   on public.dictionary_entries(user_id);
create index idx_dict_created   on public.dictionary_entries(created_at desc);
create index idx_dict_jp_text   on public.dictionary_entries(japanese_text);
create index idx_dict_tags      on public.dictionary_entries using gin(tags);

alter table public.dictionary_entries enable row level security;

create policy "own dictionary entries" on public.dictionary_entries
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger trg_dictionary_entries_upd
  before update on public.dictionary_entries
  for each row execute function public.set_updated_at();

-- ============================================================
-- user_api_keys
-- Per-user third-party API keys (OpenRouter).
-- Keys are never returned unmasked via the API.
-- ============================================================
create table public.user_api_keys (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  openrouter_api_key    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint user_api_keys_user_id_unique unique (user_id)
);

alter table public.user_api_keys enable row level security;

create policy "own api keys" on public.user_api_keys
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger trg_user_api_keys_upd
  before update on public.user_api_keys
  for each row execute function public.set_updated_at();

-- Anon role cannot access API keys under any circumstances
revoke all on public.user_api_keys from anon;
grant select, insert, update, delete on public.user_api_keys to authenticated;

-- ============================================================
-- profiles
-- One row per user. Holds user-level metadata such as role.
-- Auto-created on sign-up via trigger on auth.users.
-- ============================================================
create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile (e.g. to gate admin-only UI).
create policy "own profile read" on public.profiles
  for select using (auth.uid() = user_id);

-- No write policy for authenticated users — is_admin can only be
-- set via the Supabase dashboard or the service-role (admin) client.

-- Auto-create a profile row for every new sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger trg_new_user_profile
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- lyrics_cache
-- Shared cache of AI-generated furigana + translations.
-- Keyed by track + artist. Written via service role (admin).
-- ============================================================
create table public.lyrics_cache (
  track_name       text not null,
  artist           text not null,
  translated_lines jsonb not null,
  created_at       timestamptz not null default now(),
  primary key (track_name, artist)
);
