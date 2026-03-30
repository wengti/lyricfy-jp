'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Step {
  heading: string
  body: React.ReactNode
}

interface Props {
  service: string
  steps: Step[]
}

export default function TutorialAccordion({ service, steps }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
      >
        <span>How to get your {service} key</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 dark:text-gray-500 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Animated collapse using grid trick */}
      <div
        className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <ol className="space-y-3 px-4 pb-4 pt-1">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {i + 1}
                </span>
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{step.heading}</span>
                  {step.body && <div className="mt-0.5 text-gray-500 dark:text-gray-400">{step.body}</div>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
