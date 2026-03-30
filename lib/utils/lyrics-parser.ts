import { parse } from 'node-html-parser'

/**
 * Extracts clean lyrics lines from Genius song page HTML.
 * Targets div[data-lyrics-container="true"] elements.
 */
export function parseGeniusHtml(html: string): string[] {
  const root = parse(html)

  const containers = root.querySelectorAll('[data-lyrics-container="true"]')
  if (containers.length === 0) {
    // Fallback: try div.lyrics
    const fallback = root.querySelector('.lyrics')
    if (!fallback) return []
    return fallback.textContent
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  }

  const lines: string[] = []

  for (const container of containers) {
    // Replace <br> with newlines
    const html = container.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      // Strip annotation links but keep text
      .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
      // Strip remaining tags
      .replace(/<[^>]+>/g, '')

    const decoded = html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

    const containerLines = decoded
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('[')) // Remove [Chorus], [Verse] markers

    lines.push(...containerLines)
  }

  return lines
}
