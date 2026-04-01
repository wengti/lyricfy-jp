'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, CreditCard, Library, Music, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'

const NAV_LINKS = [
  { href: '/lyrics', label: 'Lyrics', icon: Music },
  { href: '/browse', label: 'Browse', icon: Library },
  { href: '/dictionary', label: 'Dictionary', icon: BookOpen },
  { href: '/flashcards', label: 'Flashcards', icon: CreditCard },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { isDark, toggleTheme } = useTheme()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/lyrics" className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Lyricfy<span className="text-indigo-600 dark:text-indigo-400">JP</span>
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
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side: theme toggle + settings + logout */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            href="/settings"
            aria-label="Settings"
            className={`rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 ${
              pathname.startsWith('/settings') ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : ''
            }`}
          >
            <Settings size={18} />
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  )
}
