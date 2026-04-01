import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/server'
import { ThemeProvider } from '@/contexts/ThemeContext'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LyricfyJP — Learn Japanese with Music',
  description:
    'Learn Japanese using real song lyrics — furigana annotations, live karaoke sync, personal dictionary, and flashcards.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className={`${geist.className} min-h-screen bg-gray-50 dark:bg-gray-950 antialiased`}>
        <ThemeProvider>
          {user && <Navbar />}
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
