'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, CreditCard, Music, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/lyrics', label: 'Lyrics', icon: Music },
  { href: '/dictionary', label: 'Dictionary', icon: BookOpen },
  { href: '/flashcards', label: 'Flashcards', icon: CreditCard },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/lyrics" className="text-lg font-bold tracking-tight text-gray-900">
          Lyricfy<span className="text-indigo-600">JP</span>
        </Link>

        {/* Main nav */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side: settings + logout */}
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            aria-label="Settings"
            className={`rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 ${
              pathname.startsWith('/settings') ? 'bg-indigo-50 text-indigo-700' : ''
            }`}
          >
            <Settings size={18} />
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  )
}
