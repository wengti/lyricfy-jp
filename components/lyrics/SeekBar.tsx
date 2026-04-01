'use client'

import { useRef, useState } from 'react'

interface Props {
  progressMs: number
  durationMs: number
  seekVersion: number
  onSeek: (positionMs: number) => void
  className?: string
}

export default function SeekBar({ progressMs, durationMs, seekVersion, onSeek, className = '' }: Props) {
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
    </div>
  )
}
