'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

interface DismissibleBannerProps {
  /** 배너 식별자 (쿠키 키로 사용) */
  bannerId: string
  /** 배너 메시지 */
  message: string
  /** 배경색 클래스 (기본: bg-blue-50) */
  bgColor?: string
  /** 테두리색 클래스 (기본: border-blue-200) */
  borderColor?: string
  /** 텍스트색 클래스 (기본: text-blue-800) */
  textColor?: string
  /** 버튼 색상 클래스 (기본: text-blue-600 hover:text-blue-800 hover:bg-blue-100) */
  buttonColor?: string
  /** 링크 색상 클래스 (기본: text-blue-600 hover:text-blue-800) */
  linkColor?: string
  /** 링크 URL (기본: /about) */
  linkHref?: string
  /** 링크 텍스트 (기본: 상세 정보 보기 →) */
  linkText?: string
  /** 메시지 앞에 이모지 표시 여부 (기본: true) */
  showIcon?: boolean
  /** 추가 클래스명 */
  className?: string
}

export default function DismissibleBanner({ 
  bannerId, 
  message,
  bgColor = "bg-blue-50",
  borderColor = "border-blue-200", 
  textColor = "text-blue-800",
  buttonColor = "text-blue-600 hover:text-blue-800 hover:bg-blue-100",
  linkColor = "text-blue-600 hover:text-blue-800",
  linkHref = "/about",
  linkText = "상세 정보 보기 →",
  showIcon = true,
  className = "" 
}: DismissibleBannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  // 쿠키에서 dismissed 상태 확인
  useEffect(() => {
    if (typeof document === 'undefined') return
    
    const cookieName = `banner_dismissed_${bannerId}`
    const isDismissed = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${cookieName}=`))
      ?.split('=')[1] === 'true'
    
    setIsVisible(!isDismissed)
  }, [bannerId])

  // 면책 조항 닫기
  const handleDismiss = () => {
    setIsVisible(false)
    
    // 쿠키에 dismissed 상태 저장 (1년)
    const cookieName = `banner_dismissed_${bannerId}`
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    
    document.cookie = `${cookieName}=true; expires=${expires.toUTCString()}; path=/`
  }

  if (!isVisible) return null

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-3 mb-4 relative ${className}`}>
      <button
        onClick={handleDismiss}
        className={`absolute top-2 right-2 p-1 ${buttonColor} rounded transition-colors`}
        title="이 안내를 닫습니다"
      >
        <X className="w-4 h-4" />
      </button>
      <p className={`text-sm ${textColor} pr-8`}>
        {showIcon && '💡 '}{message}
        {linkText && (
          <Link href={linkHref} className={`${linkColor} underline ml-1`}>
            {linkText}
          </Link>
        )}
      </p>
    </div>
  )
}