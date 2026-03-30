import type { LrcLine } from '@/types/ai'

/** Matches [mm:ss.xx] or [mm:ss.xxx] timestamps */
const LRC_TIMESTAMP = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]/

export function parseLrc(lrcText: string): LrcLine[] {
  const lines: LrcLine[] = []

  for (const raw of lrcText.split('\n')) {
    const line = raw.trim()
    const match = LRC_TIMESTAMP.exec(line)
    if (!match) continue

    const minutes = parseInt(match[1], 10)
    const seconds = parseInt(match[2], 10)
    const ms = parseInt(match[3].padEnd(3, '0'), 10)
    const totalMs = minutes * 60 * 1000 + seconds * 1000 + ms
    const text = line.slice(match[0].length).trim()

    if (text) {
      lines.push({ ms: totalMs, text })
    }
  }

  return lines.sort((a, b) => a.ms - b.ms)
}

/** Wraps plain text lines as unsynced LrcLines (ms = 0) */
export function plainLinesToLrc(lines: string[]): LrcLine[] {
  return lines
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ ms: 0, text }))
}
