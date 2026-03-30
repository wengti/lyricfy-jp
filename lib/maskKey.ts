/**
 * Masks an API key for safe display.
 * Shows only the last 4 characters, pads the rest with bullets.
 * e.g. "sk-or-v1-abc1234" → "••••••••••••1234"
 */
export function maskKey(key: string | null | undefined): string | null {
  if (!key) return null
  if (key.length <= 4) return '••••'
  return '•'.repeat(key.length - 4) + key.slice(-4)
}
