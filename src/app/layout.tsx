import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Call Intelligence · PestLaunch',
  description: 'Every call scored, coached and turned into action.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <Toaster position="top-center" richColors closeButton theme="system" />
      </body>
    </html>
  )
}
