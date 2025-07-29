# 계산 유틸리티

드랍/메소 획득 손익분기 계산기를 포함한 다양한 계산을 손쉽게 할 수 있는 웹 기반 유틸리티입니다.

## 기능

### 현재 이용 가능
- ✅ **드랍/메소 획득 손익분기 계산기** - 아이템 드랍률과 메소 획득량을 고려한 손익분기점 계산

### 개발 예정 🚧
- 🚧 추가 계산기들 (미정)

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **아이콘**: Lucide React
- **배포**: GitHub Pages (정적 호스팅)

## 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

1. 저장소 클론
```bash
git clone <repository-url>
cd calculator-utility
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm run dev
```

4. 브라우저에서 `http://localhost:3000` 접속

### 빌드 및 배포

#### 로컬 빌드
```bash
npm run build
```

#### GitHub Pages 배포
```bash
npm run export
npm run deploy
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지
│   ├── globals.css        # 글로벌 스타일
│   └── calculators/       # 계산기 페이지들
│       └── basic/
│           └── page.tsx
├── components/            # React 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── calculators/      # 계산기 컴포넌트
│   └── ui/              # 재사용 UI 컴포넌트
├── lib/                  # 유틸리티 함수
└── types/               # TypeScript 타입 정의
```

## 기여하기

1. Fork 생성
2. 새로운 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 라이선스

MIT License

## 특징

- 📱 **반응형 디자인**: 모바일과 데스크탑에서 모두 최적화
- 🔒 **개인정보 보호**: 모든 계산이 브라우저에서 처리됨
- ⚡ **빠른 성능**: Next.js와 정적 생성으로 최적화
- 🎨 **모던 UI**: Tailwind CSS로 구현된 깔끔한 인터페이스
- ♿ **접근성**: 웹 접근성 가이드라인 준수 