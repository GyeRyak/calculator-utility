# Supabase 설정 가이드

블로그의 좋아요 및 비공개 의견 전달 기능을 위한 Supabase 설정 방법입니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 회원가입/로그인
2. "New project" 버튼 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호, 지역 선택
4. 프로젝트 생성 완료 대기

## 2. 데이터베이스 테이블 생성

Supabase 대시보드에서 SQL Editor로 이동하여 다음 SQL을 실행하세요:

```sql
-- 좋아요 테이블
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug VARCHAR(255) NOT NULL,
  user_fingerprint VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 비공개 의견 테이블 (조회 완전 차단)
CREATE TABLE private_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_likes_post ON likes(post_slug);
CREATE INDEX idx_likes_fingerprint ON likes(user_fingerprint);
CREATE INDEX idx_feedback_post ON private_feedback(post_slug);

-- Row Level Security (RLS) 활성화
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_feedback ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
-- 좋아요는 조회/추가 가능
CREATE POLICY "Public likes read" ON likes FOR SELECT USING (true);
CREATE POLICY "Public likes insert" ON likes FOR INSERT WITH CHECK (true);

-- 비공개 의견은 작성만 가능, 조회 불가
CREATE POLICY "Private feedback insert only" ON private_feedback
FOR INSERT WITH CHECK (true);

-- 조회는 완전히 차단 (관리자만 Supabase 대시보드에서 확인)
CREATE POLICY "No public read" ON private_feedback
FOR SELECT USING (false);
```

## 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# GitHub 설정 (댓글 기능용)
NEXT_PUBLIC_GITHUB_OWNER=your-github-username
NEXT_PUBLIC_GITHUB_REPO=calculator-utility
```

### 환경 변수 값 찾기:

1. **SUPABASE_URL**: Supabase 프로젝트 Settings → API → Project URL
2. **SUPABASE_ANON_KEY**: Supabase 프로젝트 Settings → API → Project API keys → anon public

## 4. GitHub 댓글 설정

### 자동 설정 (권장)
1. 블로그 포스트에서 "GitHub에서 Issue 생성하기" 버튼 클릭
2. 자동 생성된 템플릿으로 Issue 생성
3. 생성된 Issue 번호를 "Issue 번호 직접 입력"에 입력

### 수동 설정
1. GitHub 저장소에서 Issues 탭으로 이동
2. "New issue" 클릭
3. 다음 형식으로 Issue 생성:
   - 제목: `[Blog Comments] 포스트 제목`
   - 라벨: `blog-comments`
   - 본문: 포스트 링크 및 설명
4. 생성된 Issue 번호를 블로그에서 설정

## 5. 보안 설정 확인

### RLS 정책 확인
- 좋아요: 누구나 조회/추가 가능
- 비공개 의견: 작성만 가능, 조회 불가

### API 키 보안
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 공개되어도 안전
- RLS 정책이 실제 보안을 담당
- Rate limiting은 Supabase 대시보드에서 설정 가능

## 6. 테스트

1. 블로그 포스트에서 좋아요 버튼 클릭 테스트
2. 비공개 의견 전달 테스트
3. Supabase 대시보드에서 데이터 확인

## 7. 모니터링

### Supabase 대시보드에서 확인 가능한 항목:
- 좋아요 수 통계
- 비공개 의견 내용 (관리자만)
- API 사용량
- 에러 로그

### 사용량 제한 (무료 티어):
- 월 50,000 읽기
- 월 20,000 쓰기
- 500MB 데이터베이스 저장소
- 1GB 파일 저장소

일반적인 블로그 사용량으로는 충분합니다.

## 문제 해결

### 자주 발생하는 문제:

1. **환경 변수를 인식하지 못함**
   - `.env.local` 파일 위치 확인
   - 개발 서버 재시작 (`npm run dev`)

2. **RLS 정책 오류**
   - SQL 실행 순서 확인
   - 테이블 생성 후 RLS 활성화 및 정책 생성

3. **좋아요 중복 오류**
   - localStorage 초기화
   - 브라우저 새로고침

4. **GitHub 댓글이 표시되지 않음**
   - Issue 번호 확인
   - GitHub 저장소가 공개되어 있는지 확인

### 도움이 필요한 경우:
- Supabase 공식 문서: https://supabase.com/docs
- GitHub Issues에서 문의: 저장소의 Issues 탭 활용