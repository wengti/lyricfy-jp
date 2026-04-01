'use client'

import { useRef, useState } from 'react'

function fmtMs(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface Props {
  progressMs: number
  durationMs: number
  seekVersion: number
  onSeek: (positionMs: number) => void
  showTime?: boolean
  className?: string
}

export default function SeekBar({ progressMs, durationMs, seekVersion, onSeek, showTime = false, className = '' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [pendingMs, setPendingMs] = useState<number | null>(null)

  const displayMs = pendingMs ?? progressMs
  const pct = durationMs > 0 ? Math.min((displayMs / durationMs) * 100, 100) : 0
  const isDragging = pendingMs !== null

  function msFromPointer(e: React.PointerEvent): number {
    const rect = trackRef.current!.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    return ratio * durationMs
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    trackRef.current!.setPointerCapture(e.pointerId)
    const ms = msFromPointer(e)
    setPendingMs(ms)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return
    setPendingMs(msFromPointer(e))
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return
    const ms = msFromPointer(e)
    setPendingMs(null)
    onSeek(ms)
  }

  return (
    <div className={`group relative flex items-center ${className}`}>
      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-1 w-full cursor-pointer rounded-full bg-gray-100 transition-all group-hover:h-2 dark:bg-gray-800"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Fill */}
        <div
          key={isDragging ? undefined : `${durationMs}-${seekVersion}`}
          className="h-full rounded-full bg-indigo-400"
          style={{
            width: `${pct}%`,
            transition: isDragging ? 'none' : 'width 1000ms linear',
          }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-indigo-400 shadow opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${pct}%` }}
        />
      </div>
      {showTime && (
        <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
          <span>{fmtMs(displayMs)}</span>
          <span>{fmtMs(durationMs)}</span>
        </div>
      )}
    </div>
  )
}
