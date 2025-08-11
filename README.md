# 계산 유틸리티

드랍/메소 획득 손익분기 계산기를 포함한 다양한 계산을 손쉽게 할 수 있는 웹 기반 유틸리티입니다.

## 기능

### 현재 이용 가능
- ✅ **사냥 기댓값 계산기** - 드롭률과 메소 획득량을 고려한 사냥 기댓값 계산
- ✅ **손익분기 계산기** - 아이템 드롭률과 메소 획득량을 고려한 손익분기점 계산
- ✅ **통합 슬롯 시스템** - 각 계산기별 3개 슬롯으로 설정 저장/불러오기 지원

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
│       ├── basic/         # 사냥 기댓값 계산기
│       └── breakeven/     # 손익분기 계산기
├── components/            # React 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── calculators/      # 계산기 컴포넌트
│   └── ui/              # 재사용 UI 컴포넌트
│       └── AutoSlotManager.tsx  # 통합 슬롯 관리 시스템
├── utils/                # 유틸리티 함수 및 계산 로직
│   ├── calculations/     # 각종 계산 함수들
│   ├── cookies.ts       # 데이터 저장/불러오기
│   └── defaults/        # 기본값 상수들
└── hooks/               # 커스텀 React Hook들
```

## 기여하기

### 건의사항 및 버그 리포트
- **Issue 생성**: [GitHub Issues](https://github.com/gyeryak/calculator-utility/issues)에서 새로운 이슈를 생성해주세요
- 버그 리포트, 기능 제안, 개선 요청 등을 환영합니다
- 이슈 작성 시 가능한 한 자세히 설명해주세요

### 코드 기여
1. Fork 생성
2. 새로운 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. [Pull Request](https://github.com/gyeryak/calculator-utility/pulls) 생성

### 기여 가이드라인
- 코드 스타일은 기존 코드베이스와 일치시켜주세요
- 새로운 기능 추가 시 관련 문서도 함께 업데이트해주세요
- 커밋 메시지는 명확하고 간결하게 작성해주세요

## 라이선스

본 프로젝트는 커스텀 라이선스를 사용합니다. 자세한 내용은 [LICENSE.md](LICENSE.md)를 참조하세요.

### 주요 라이선스 조건
- ❌ **코드 자체 판매 금지**: 코드 자체를 판매하는 형태로 활용 불가
- ✅ **소규모 재사용**: 코드 일부만 활용 시 코드 판매 금지 외 MIT 라이선스와 동일한 조건
- 📝 **대규모 재사용**: 코드 대량 활용 시 출처 표기 필수
- ⚠️ **무보증**: 소프트웨어 사용에 대한 어떠한 보증도 제공하지 않습니다

## 특징

- 📱 **반응형 디자인**: 모바일과 데스크탑에서 모두 최적화
- 🔒 **개인정보 보호**: 모든 계산이 브라우저에서 처리됨 (서버 저장 없음)
- 💾 **자동 저장**: 각 계산기별 3개 슬롯으로 설정 자동 저장/불러오기
- ⚡ **빠른 성능**: Next.js와 정적 생성으로 최적화
- 🎨 **모던 UI**: Tailwind CSS로 구현된 깔끔한 인터페이스
- 🔄 **데이터 마이그레이션**: 버전 업그레이드 시 기존 데이터 자동 호환
- ♿ **접근성**: 웹 접근성 가이드라인 준수 