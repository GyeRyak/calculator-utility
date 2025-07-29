import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import CookieProvider from '@/components/providers/CookieProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '계산 유틸리티',
  description: '드랍/메소 획득 손익분기 계산기를 포함한 다양한 계산 도구',
  keywords: ['계산기', '드랍률', '메소', '손익분기', '유틸리티', 'calculator'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} min-h-screen bg-background`}>
        <CookieProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </CookieProvider>
      </body>
    </html>
  )
} 