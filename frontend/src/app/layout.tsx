import type { Metadata } from 'next'
import { Inter, Cinzel, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
})

const cinzel = Cinzel({ 
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Agent Arena — Command AI Champions',
  description: 'Command AI agents. Conquer the depths. Rise to glory.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-arena-deep text-[#e8e6e3] font-body antialiased">
        {children}
      </body>
    </html>
  )
}
