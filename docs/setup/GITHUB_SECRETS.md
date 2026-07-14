# GitHub Secrets 설정 가이드

GitHub Pages 자동 배포 시 Supabase 및 GitHub API 환경 변수를 안전하게 전달하는 방법입니다.

## 1. GitHub Repository Secrets 설정

### 단계별 설정 방법:

1. **GitHub 저장소로 이동**
   - 본 프로젝트의 GitHub 저장소 페이지 접속

2. **Settings 탭 클릭**
   - 저장소 상단 메뉴에서 "Settings" 클릭

3. **Secrets and variables 메뉴**
   - 왼쪽 사이드바에서 "Secrets and variables" → "Actions" 클릭

4. **New repository secret 버튼 클릭**
   - "New repository secret" 버튼을 눌러 새로운 시크릿 추가

### 추가해야 할 Secrets:

#### Supabase 관련 환경 변수:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project-id.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGc... (Supabase anon key)
```

#### GitHub API 관련 환경 변수:
```
Name: NEXT_PUBLIC_GITHUB_OWNER
Value: your-github-username

Name: NEXT_PUBLIC_GITHUB_REPO
Value: calculator-utility
```

## 2. Supabase 환경 변수 값 찾기

### SUPABASE_URL 찾기:
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. Settings → API → Project URL 복사

### SUPABASE_ANON_KEY 찾기:
1. 같은 페이지에서 Project API keys 섹션
2. "anon public" 키 복사 (⚠️ service_role 키가 아님!)

## 3. 배포 과정

### 자동 배포 (권장):
1. 환경 변수 설정 완료 후
2. `main` 브랜치에 코드 푸시
3. GitHub Actions가 자동으로 빌드 및 배포

```bash
git add .
git commit -m "feat: 블로그 댓글 시스템 추가"
git push origin main
```

### 수동 배포 (기존 방식):
로컬에서 `.env.local` 설정 후:
```bash
npm run deploy
```

## 4. 배포 상태 확인

### GitHub Actions 로그 확인:
1. 저장소 → "Actions" 탭
2. 최신 워크플로우 실행 결과 확인
3. 빌드 과정에서 환경 변수 로딩 확인

### 배포 완료 확인:
- GitHub Pages URL에서 블로그 댓글 기능 테스트
- 좋아요 버튼 동작 확인
- 댓글 작성 기능 테스트

## 5. 보안 주의사항

### ✅ 안전한 사항:
- `NEXT_PUBLIC_*` 환경 변수는 클라이언트에 노출됨
- Supabase anon key는 RLS 정책으로 보호됨
- GitHub Secrets는 로그에 마스킹되어 표시됨

### ⚠️ 주의사항:
- **절대 service_role 키를 사용하지 말 것**
- **anon key만 사용할 것**
- **RLS 정책이 올바르게 설정되어 있는지 확인**

## 6. 문제 해결

### 빌드 실패 시:
```bash
# 로컬에서 환경 변수 없이 빌드 테스트
npm run build
```
- Supabase 비활성화 상태에서도 빌드 성공해야 함

### 환경 변수 오류 시:
1. GitHub Secrets 이름 정확히 확인
2. Supabase 프로젝트 URL과 키 재확인
3. GitHub Actions 로그에서 환경 변수 로딩 상태 확인

### 댓글 기능 동작 안 함:
1. 브라우저 콘솔에서 Supabase 연결 오류 확인
2. GitHub Repository public 상태 확인
3. Issue 번호 올바른 연결 확인

## 7. 추가 설정 (선택사항)

### 환경별 분리:
- `NEXT_PUBLIC_GITHUB_OWNER`를 저장소마다 다르게 설정 가능
- 개발/프로덕션 Supabase 프로젝트 분리 가능

### 모니터링:
- Supabase Dashboard에서 API 사용량 모니터링
- GitHub Actions 사용량 확인