import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'CreatorGraph Lite — LinkedIn Memory for Professionals',
  description: 'Context-engineering-powered content memory for LinkedIn thought leaders.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isMock = process.env.MOCK_AUTH === 'true'

  const body = (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )

  if (isMock) return body

  return <ClerkProvider>{body}</ClerkProvider>
}
