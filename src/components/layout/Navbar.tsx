'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Calculator, Settings, ChevronDown } from 'lucide-react'
import CookieSettings from '@/components/ui/CookieSettings'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showCookieSettings, setShowCookieSettings] = useState(false)
  const [isCalculatorMenuOpen, setIsCalculatorMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">계산 유틸리티</span>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              홈
            </Link>
            
            {/* 계산기 드롭다운 */}
            <div 
              className="relative"
              onMouseEnter={() => setIsCalculatorMenuOpen(true)}
              onMouseLeave={() => setIsCalculatorMenuOpen(false)}
            >
              <button
                className="text-foreground hover:text-primary transition-colors flex items-center gap-1 py-2"
              >
                계산기
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {isCalculatorMenuOpen && (
                <div className="absolute top-full left-0 bg-white shadow-lg rounded-lg border py-2 min-w-48 z-50"
                >
                  <Link
                    href="/calculators"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    전체 계산기 목록
                  </Link>
                  <div className="border-t my-1"></div>
                  <Link
                    href="/calculators/basic"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    사냥 기댓값 계산기
                  </Link>
                  <Link
                    href="/calculators/breakeven"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    손익분기 계산기
                  </Link>
                  <Link
                    href="/calculators/boss-chase"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    보스 물욕템 계산기
                  </Link>
                  <Link
                    href="/calculators/lounge"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    휴게실 경험치 최적화 계산기
                  </Link>
                </div>
              )}
            </div>
            
            <Link href="/about" className="text-foreground hover:text-primary transition-colors">
              소개
            </Link>
            <button
              onClick={() => setShowCookieSettings(true)}
              className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
              title="쿠키 설정"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">쿠키 설정</span>
            </button>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
            aria-label="메뉴 토글"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                홈
              </Link>
              
              {/* 모바일 계산기 메뉴 */}
              <div className="px-2">
                <div className="text-foreground font-medium mb-2">계산기</div>
                <div className="ml-4 space-y-2">
                  <Link 
                    href="/calculators" 
                    className="block text-sm text-gray-600 hover:text-primary transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    전체 계산기 목록
                  </Link>
                  <Link 
                    href="/calculators/basic" 
                    className="block text-sm text-gray-600 hover:text-primary transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    사냥 기댓값 계산기
                  </Link>
                  <Link 
                    href="/calculators/breakeven" 
                    className="block text-sm text-gray-600 hover:text-primary transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    손익분기 계산기
                  </Link>
                  <Link
                    href="/calculators/boss-chase"
                    className="block text-sm text-gray-600 hover:text-primary transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    보스 물욕템 계산기
                  </Link>
                  <Link
                    href="/calculators/lounge"
                    className="block text-sm text-gray-600 hover:text-primary transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    휴게실 경험치 최적화 계산기
                  </Link>
                </div>
              </div>
              
              <Link 
                href="/about" 
                className="text-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                소개
              </Link>
              <button
                onClick={() => {
                  setShowCookieSettings(true)
                  setIsMenuOpen(false)
                }}
                className="text-foreground hover:text-primary transition-colors px-2 py-1 flex items-center gap-2 text-left"
              >
                <Settings className="w-4 h-4" />
                쿠키 설정
              </button>
            </div>
          </div>
        )}
        
        {/* 쿠키 셈정 모달 */}
        <CookieSettings 
          isOpen={showCookieSettings}
          onClose={() => setShowCookieSettings(false)}
        />
      </div>
    </nav>
  )
} 