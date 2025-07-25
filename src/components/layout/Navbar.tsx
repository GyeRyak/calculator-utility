'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Calculator } from 'lucide-react'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
            <Link href="/calculators" className="text-foreground hover:text-primary transition-colors">
              계산기
            </Link>
            <Link href="/about" className="text-foreground hover:text-primary transition-colors">
              소개
            </Link>
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
              <Link 
                href="/calculators" 
                className="text-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                계산기
              </Link>
              <Link 
                href="/about" 
                className="text-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                소개
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 