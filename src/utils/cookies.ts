'use client'

// 쿠키 관리 유틸리티

export interface CookieOptions {
  expires?: number | Date // 만료일 (일 수 또는 Date 객체)
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

// 쿠키 설정
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
  
  if (options.expires) {
    let expiresDate: Date
    if (typeof options.expires === 'number') {
      expiresDate = new Date()
      expiresDate.setTime(expiresDate.getTime() + (options.expires * 24 * 60 * 60 * 1000))
    } else {
      expiresDate = options.expires
    }
    cookieString += `; expires=${expiresDate.toUTCString()}`
  }
  
  if (options.path) {
    cookieString += `; path=${options.path}`
  }
  
  if (options.domain) {
    cookieString += `; domain=${options.domain}`
  }
  
  if (options.secure) {
    cookieString += `; secure`
  }
  
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`
  }
  
  document.cookie = cookieString
}

// 쿠키 조회
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const nameEQ = encodeURIComponent(name) + '='
  const cookies = document.cookie.split(';')
  
  for (let cookie of cookies) {
    let c = cookie.trim()
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length))
    }
  }
  
  return null
}

// 쿠키 삭제
export function deleteCookie(name: string, path?: string, domain?: string): void {
  setCookie(name, '', {
    expires: new Date(0),
    path,
    domain
  })
}

// 모든 쿠키 조회
export function getAllCookies(): { [key: string]: string } {
  if (typeof document === 'undefined') return {}
  
  const cookies: { [key: string]: string } = {}
  const cookieArray = document.cookie.split(';')
  
  for (let cookie of cookieArray) {
    const [name, value] = cookie.split('=').map(c => c.trim())
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value)
    }
  }
  
  return cookies
}

// 쿠키 동의 관리
export const COOKIE_CONSENT_KEY = 'cookie_consent'
export const COOKIE_SETTINGS_KEY = 'cookie_settings'

export interface CookieConsent {
  necessary: boolean // 필수 쿠키 (항상 true)
  functional: boolean // 기능성 쿠키 (설정 저장 등)
  analytics: boolean // 분석 쿠키 (사용하지 않음, 확장성을 위해 포함)
  marketing: boolean // 마케팅 쿠키 (사용하지 않음, 확장성을 위해 포함)
  consentDate: string // 동의 날짜
}

// 기본 쿠키 동의 설정
export const DEFAULT_COOKIE_CONSENT: CookieConsent = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  consentDate: new Date().toISOString()
}

// 쿠키 동의 상태 조회
export function getCookieConsent(): CookieConsent | null {
  const consentData = getCookie(COOKIE_CONSENT_KEY)
  if (!consentData) return null
  
  try {
    return JSON.parse(consentData)
  } catch {
    return null
  }
}

// 쿠키 동의 저장
export function setCookieConsent(consent: CookieConsent): void {
  setCookie(COOKIE_CONSENT_KEY, JSON.stringify(consent), {
    expires: 365, // 1년
    path: '/',
    sameSite: 'lax'
  })
}

// 쿠키 사용 허용 여부 확인
export function isCookieAllowed(type: keyof Omit<CookieConsent, 'consentDate'>): boolean {
  const consent = getCookieConsent()
  if (!consent) return false
  return consent[type]
}

// 기능성 쿠키 사용 가능 여부 확인
export function canUseFunctionalCookies(): boolean {
  return isCookieAllowed('functional')
}

// 슬롯별 쿠키 키 생성
function getSlotKey(slotNumber: number): string {
  return `${COOKIE_SETTINGS_KEY}_slot_${slotNumber}`
}

// 계산기 설정 저장 (슬롯 지원)
export function saveCalculatorSettings(settings: any, slotNumber: number = 1): boolean {
  if (!canUseFunctionalCookies()) {
    console.warn('Functional cookies are not allowed. Settings will not be saved.')
    return false
  }
  
  if (slotNumber < 1 || slotNumber > 3) {
    console.error('Invalid slot number. Must be between 1 and 3.')
    return false
  }
  
  try {
    const slotKey = getSlotKey(slotNumber)
    // localStorage 사용으로 변경
    localStorage.setItem(slotKey, JSON.stringify(settings))
    return true
  } catch (error) {
    console.error(`Failed to save calculator settings to slot ${slotNumber}:`, error)
    return false
  }
}

// 계산기 설정 불러오기 (슬롯 지원)
export function loadCalculatorSettings(slotNumber: number = 1): any | null {
  if (!canUseFunctionalCookies()) {
    return null
  }
  
  if (slotNumber < 1 || slotNumber > 3) {
    console.error('Invalid slot number. Must be between 1 and 3.')
    return null
  }
  
  try {
    const slotKey = getSlotKey(slotNumber)
    // localStorage 사용으로 변경
    const settingsData = localStorage.getItem(slotKey)
    if (!settingsData) return null
    
    return JSON.parse(settingsData)
  } catch (error) {
    console.error(`Failed to load calculator settings from slot ${slotNumber}:`, error)
    return null
  }
}

// 특정 슬롯의 계산기 설정 삭제
export function clearCalculatorSettings(slotNumber?: number): void {
  try {
    if (slotNumber === undefined) {
      // 모든 슬롯 삭제
      for (let i = 1; i <= 3; i++) {
        localStorage.removeItem(getSlotKey(i))
      }
    } else if (slotNumber >= 1 && slotNumber <= 3) {
      // 특정 슬롯만 삭제
      localStorage.removeItem(getSlotKey(slotNumber))
    }
  } catch (error) {
    console.error('Failed to clear calculator settings:', error)
  }
}

// 슬롯에 저장된 데이터가 있는지 확인
export function hasSlotData(slotNumber: number): boolean {
  if (!canUseFunctionalCookies()) return false
  
  if (slotNumber < 1 || slotNumber > 3) return false
  
  try {
    const slotKey = getSlotKey(slotNumber)
    return localStorage.getItem(slotKey) !== null
  } catch {
    return false
  }
}

// 모든 비필수 쿠키 삭제
export function clearAllNonEssentialCookies(): void {
  clearCalculatorSettings()
  // 필요시 다른 기능성 쿠키들도 여기서 삭제
}