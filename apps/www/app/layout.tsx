import './globals.css'

import Providers from '@/components/providers'
import type { Metadata } from 'next'
import { Hanken_Grotesk } from 'next/font/google'
import localFont from 'next/font/local'

const hankenGrotesk = Hanken_Grotesk({
  variable: '--font-hanken-grotesk',
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
    <html lang="en" className={`${hankenGrotesk.variable} ${drukWideHeavyItalic.variable} antialiased`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
