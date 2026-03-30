import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/server'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LyricfyJP — Learn Japanese with Music',
  description:
    'Learn Japanese using real song lyrics — furigana annotations, live karaoke sync, personal dictionary, and flashcards.',
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
    <html lang="en">
      <body className={`${geist.className} min-h-screen bg-gray-50 antialiased`}>
        {user && <Navbar />}
        <main>{children}</main>
      </body>
    </html>
  )
}
