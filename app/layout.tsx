import type { Metadata } from 'next'
import { Inter }         from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Chatbot }       from '@/components/chat/chatbot'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'CreatorGraph Beta — LinkedIn Memory for Professionals',
  description: 'Context-engineering-powered content memory for LinkedIn thought leaders.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isMock = process.env.MOCK_AUTH === 'true'

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {isMock ? children : <ClerkProvider>{children}</ClerkProvider>}
        <Chatbot />
      </body>
    </html>
  )
}
