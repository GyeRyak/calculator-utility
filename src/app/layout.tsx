import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import CookieProvider from '@/components/providers/CookieProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '계산 유틸리티',
  description: '사냥 기댓값 계산기를 포함한 다양한 계산 도구',
  keywords: ['계산기', '사냥', '기댓값', '드랍률', '메소', '획득량', '유틸리티'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // GitHub Pages 클라이언트 사이드 라우팅 지원
              (function(l) {
                if (l.search[1] === '/' ) {
                  var decoded = l.search.slice(1).split('&').map(function(s) { 
                    return s.replace(/~and~/g, '&')
                  }).join('?');
                  window.history.replaceState(null, null,
                      l.pathname.slice(0, -1) + decoded + l.hash
                  );
                }
              }(window.location))
            `
          }}
        />
      </head>
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