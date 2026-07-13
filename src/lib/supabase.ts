import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabase 클라이언트 초기화 (환경 변수가 없으면 null)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Supabase 사용 가능 여부 확인
export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey)

// 데이터베이스 타입 정의
export interface Like {
  id: string
  post_slug: string
  user_fingerprint: string
  created_at: string
}

export interface PrivateFeedback {
  id: string
  post_slug: string
  content: string
  created_at: string
}