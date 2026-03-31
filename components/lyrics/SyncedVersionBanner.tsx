'use client'

import { useState } from 'react'
import type { LrcLine } from '@/types/ai'

interface SyncedVersionBannerProps {
  lines: LrcLine[]
  isAdmin: boolean
  onAccept: () => Promise<void>
  accepting: boolean
  track: string
  artist: string
}

export default function SyncedVersionBanner({
  lines,
  isAdmin,
  onAccept,
  accepting,
  track,
  artist,
}: SyncedVersionBannerProps) {
  const [expanded, setExpanded] = useState(false)

  const subject = encodeURIComponent(`Synced lyrics available — ${track} by ${artist}`)
  const body = encodeURIComponent(
    `Hi,\n\nA synced version of "${track}" by ${artist} is now available on lrclib.net. Could you upgrade it in Lyricfy?\n\nThanks!`
  )

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-500 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
            </svg>
          </span>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Synced version available on lrclib.net
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 flex-shrink-0 text-blue-500 transition-transform dark:text-blue-400 ${expanded ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-blue-200 px-4 py-3 dark:border-blue-800">
          <p className="mb-3 text-sm text-blue-700 dark:text-blue-300">
            lrclib.net now has a synced (timestamped) version of these lyrics. Upgrading will enable karaoke sync and replace the current unsynced version.
          </p>
          <div className="mb-3 max-h-48 overflow-y-auto rounded-md border border-blue-200 bg-white px-3 py-2 dark:border-blue-800 dark:bg-gray-900">
            {lines.map((line, i) => (
              <p key={i} className="py-0.5 text-sm text-gray-700 dark:text-gray-300">
                {line.text}
              </p>
            ))}
          </div>
          {isAdmin ? (
            <button
              type="button"
              onClick={onAccept}
              disabled={accepting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {accepting && (
                <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {accepting ? 'Upgrading…' : 'Upgrade to synced lyrics'}
            </button>
          ) : (
            <a
              href={`mailto:wengti@hotmail.com?subject=${subject}&body=${body}`}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Contact admin
            </a>
          )}
        </div>
      )}
    </div>
  )
}
