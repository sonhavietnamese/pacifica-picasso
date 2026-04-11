import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers'
import localFont from 'next/font/local'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const drukWideHeavyItalic = localFont({
  src: '../assets/fonts/Druk-WideHeavyItalic.ttf',
  variable: '--font-druk-wide',
  weight: '900',
  style: 'italic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Picasso',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${drukWideHeavyItalic.variable} antialiased`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
