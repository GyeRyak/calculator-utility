import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import CookieProvider from '@/components/providers/CookieProvider'
import { NotificationProvider } from '@/contexts/NotificationContext'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'production' 
      ? 'https://www.maplecalc.com' 
      : 'http://localhost:3000'
  ),
  title: '계산 유틸리티',
  description: '사냥 기댓값 계산기를 포함한 다양한 계산 도구',
  keywords: ['계산기', '사냥', '기댓값', '드롭률', '메소', '획득량', '유틸리티'],
  openGraph: {
    type: 'website',
    title: '계산 유틸리티',
    description: '사냥 기댓값 계산기를 포함한 다양한 계산 도구',
    siteName: '계산 유틸리티',
    locale: 'ko_KR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-site-verification" content="MisTb5jkBh5riUOSrXvEbyrqqoLwV184cqHgsL6-Z-Y" />
        <meta name="google-adsense-account" content="ca-pub-6146739804286620" />
        <GoogleAnalytics />
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
      <body className={`${inter.className} min-h-screen bg-background flex flex-col`}>
        <CookieProvider>
          <NotificationProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-8 flex-grow">
              {children}
            </main>
            <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
              <div className="container mx-auto px-4 py-4">
                <div className="text-center text-xs text-gray-600">
                  <p className="mb-2">
                    Calculator Utility is not affiliated with or endorsed by any game companies including NEXON Korea, and does not provide any warranty.
                  </p>
                  <p>
                    본 사이트는 넥슨 코리아를 비롯한 어떠한 게임사와도 관계가 없으며, 공식 인증을 받지 않은 비공식 사이트입니다.
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p>© 2025 Calculator Utility. 
                      <a href="https://github.com/gyeryak/calculator-utility/blob/main/LICENSE.md" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-blue-600 hover:text-blue-800 underline ml-1">
                        커스텀 라이선스
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </footer>
          </NotificationProvider>
        </CookieProvider>
      </body>
    </html>
  )
} 