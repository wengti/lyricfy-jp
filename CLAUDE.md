# Lyricfy-JP — Developer Guide

Japanese language learning web app. Users connect Spotify, see live karaoke lyrics with furigana annotations, save words to a personal dictionary, and practice with flashcards. Every user supplies their own third-party API keys via the Settings page — no shared server credentials.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript, `--no-src-dir`) |
| Styling | Tailwind CSS v4 — configured via `postcss.config.mjs`, no `tailwind.config.ts` |
| Database | Supabase (Postgres + Auth + RLS) |
| AI | OpenRouter → `google/gemma-3-27b-it:free` |
| Lyrics | lrclib.net (primary) → Genius API scraping (fallback) → manual paste |
| Music | Spotify Web API (OAuth, `currently-playing` with `progress_ms`) |

---

## Project Structure

Routes live at the root level (`app/`), not under `src/`. Components live in `components/`, hooks in `hooks/`, server utilities in `lib/`.

---

## Multi-User API Key Architecture

**This is the most important architectural rule.** There are no shared API keys in environment variables. Every user provides their own keys via `/settings`.

- Keys are stored in the `user_api_keys` Supabase table with RLS (`auth.uid() = user_id`).
- The `anon` role is explicitly revoked from this table.
- All API routes fetch keys server-side using `lib/getUserApiKeys.ts`.
- Keys are **never** sent to the client. The GET `/api/settings` endpoint returns only masked values (last 4 chars visible).
- Empty strings on PUT are ignored — partial updates are safe.

### Required pattern in every API route that calls a third-party service

```typescript
import { requireApiKey } from '@/lib/getUserApiKeys'

const apiKey = await requireApiKey('openrouter_api_key', 'OpenRouter API Key')
```

If the key is missing, `requireApiKey` throws with a user-friendly message: _"No OpenRouter API Key configured. Please add it in Settings (/settings)."_ The API route should catch this and return `{ status: 422, error: message }`.

### Keys stored per user

| Field | Used by |
|---|---|
| `openrouter_api_key` | All AI routes (`/api/ai/*`) |

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=          # used for Spotify redirect URI
SPOTIFY_CLIENT_ID=            # Spotify OAuth
SPOTIFY_CLIENT_SECRET=        # Spotify OAuth + token refresh
ENCRYPTION_SECRET=            # 64 hex chars (32 bytes) — AES-256-GCM key for user API keys
```

Generate a value with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Database Tables

See `supabase/schema.sql` for full DDL. Summary:

- **`spotify_tokens`** — one row per user, OAuth tokens, auto-refreshed in `lib/spotify/api.ts`
- **`dictionary_entries`** — user's saved words (japanese_text, hiragana, english_translation, example sentences, tags, source metadata)
- **`user_api_keys`** — per-user API credentials (see above)

RLS is enabled on all three tables. The `set_updated_at()` trigger is shared.

---

## Key Libraries and Helpers

### `lib/getUserApiKeys.ts`
- `getUserApiKeys()` — fetches the current user's row via RLS; returns `null` if no row exists
- `requireApiKey(field, friendlyName)` — throws if the field is missing or empty

### `lib/openrouter/client.ts`
- `openRouterChat(messages, options)` — base wrapper; strips markdown fences; supports `jsonMode: true`

### `lib/openrouter/furigana.ts`
- Single call returns both `furigana` tokens AND `translations` for up to 25 lines

### `lib/spotify/api.ts`
- `getValidAccessToken(userId)` — checks expiry (5-min buffer), refreshes inline if needed, updates DB

### `lib/utils/lrc-parser.ts`
- Parses `[mm:ss.xx]` timestamps → `{ ms: number, text: string }[]`

### `lib/utils/japanese.ts`
- `hasJapaneseChars()`, `isRomaji()`, `detectScript()` → `'japanese' | 'romaji' | 'other'`

---

## AI Routes (`/api/ai/*`)

All routes require `openrouter_api_key`. Return `422` with a descriptive error if any required key is missing.

| Route | Input | Output |
|---|---|---|
| `POST /api/ai/furigana` | `{ lines: string[] }` | `{ furigana: FuriganaToken[][], translations: string[] }` |
| `POST /api/ai/enrich-word` | `{ word: string }` | `{ hiragana, english_translation, example_japanese, example_english }` |
| `POST /api/ai/romaji-to-japanese` | `{ lines: string[] }` | `{ lines: string[] }` |

---

## Lyrics Pipeline

1. **lrclib.net** — synced LRC with timestamps (free, no key needed)
2. **Genius scraping** — requires `genius_access_token`; returns unsynced lines
3. **Manual paste** — `ManualLyricsInput` component shown when both fail

After fetching, run `detectScript()` to set `isJapanese` and `wasRomaji` flags. If romaji detected, auto-convert via `/api/ai/romaji-to-japanese`.

---

## Spotify OAuth Flow

Each user registers their own Spotify app at developer.spotify.com. The exact redirect URI is:

```
{NEXT_PUBLIC_APP_URL}/api/spotify/callback
```

This URI is displayed with a copy button in `/settings` under the Spotify tutorial.

---

## Protected Routes

`middleware.ts` protects: `/lyrics`, `/dictionary`, `/flashcards`, `/settings`. Unauthenticated users are redirected to `/auth/login`.

---

## Claude Code Hooks

`.claude/settings.local.json` has two hooks:

- **PostToolUse on Write/Edit** → `api-key-reminder.js`: if the edited file is under `app/api/`, injects a reminder to use `requireApiKey()` instead of `process.env`.
- **PreToolUse on Bash** → `tsc-before-commit.js`: intercepts `git commit` commands and runs `tsc --noEmit` first. Blocks the commit if there are type errors.

---

## Git & GitHub

Repository: **https://github.com/wengti/lyricfy-jp**

After completing each feature or fix, commit and push with a concise message following this format:

```
<type>: <short description>
```

Types: `feat`, `fix`, `refactor`, `style`, `chore`

Examples:
- `feat: add dark mode with system preference detection`
- `fix: skip furigana for Chinese and non-Japanese lyrics`
- `refactor: move Spotify keys to server environment variables`

Rules:
- One commit per logical feature or fix — don't batch unrelated changes
- Keep the subject line under 72 characters
- No trailing period
- After completing a task, summarize the changes made and immediately proceed to commit and push — do not ask for permission first

---

## Component Conventions

- Server components fetch data directly from Supabase (no API round-trip).
- Client components are marked `'use client'` and fetch via `/api/*` routes.
- Modals (`AddWordModal`, `EditWordModal`, `SaveToDictionaryModal`) accept `onSave` typed as `Promise<unknown>` — callers never use the return value.
- CSS 3D flip in `FlashcardCard` uses `transform-style: preserve-3d` + `backfaceVisibility: hidden` — requires inline styles (Tailwind purges arbitrary transform values).
- Ruby annotations use `<ruby>/<rt>` HTML elements; base styles are in `app/globals.css`.
