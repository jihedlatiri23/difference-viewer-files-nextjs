import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Diff Viewer - File Comparison Tool',
  description: 'Compare two text files side-by-side or inline with word-level highlighting',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

