# 계산 유틸리티

드랍/메소 획득 손익분기 계산기를 포함한 다양한 계산을 손쉽게 할 수 있는 웹 기반 유틸리티입니다.

## 기능

특수 아이템 드롭률의 역산 모델과 표본 근거는 [드롭률 연구 문서](./docs/research/DROP_RATE.md)에 정리했습니다.

### 현재 이용 가능
- ✅ **사냥 기댓값 계산기** - 드롭률과 메소 획득량을 고려한 사냥 기댓값 계산
- ✅ **손익분기 계산기** - 아이템 드롭률과 메소 획득량을 고려한 손익분기점 계산
- ✅ **보스 물욕템 계산기** - 캐릭터별 보스 클리어 기준 주간/월간 드롭 기댓값 계산
- ✅ **통합 슬롯 시스템** - 각 계산기별 5개 슬롯 저장, 복사, 텍스트 내보내기/불러오기 지원
- ✅ **기술 블로그** - Markdown, GFM, KaTeX 기반 정적 블로그

### 종료된 이벤트
- **휴게실 경험치 최적화 계산기** - 아지트 듀오 휴게실 이벤트의 최적 스킬 투자 전략을 Dynamic Programming으로 계산
- **록 스타 돌의 정령 확률 계산기** - 색종이 보유량에 따른 이벤트 달성 확률 분석
- **한글날 훈장 이벤트 계산기** - 훈장 조합 재설정 비용과 확률 분포 분석

### 개발 예정 📋
- 📋 추가 계산기들 (미정)

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

### 검증
```bash
npm test
npm run lint
npm run build
```

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
│       ├── breakeven/     # 손익분기 계산기
│       ├── lounge/        # 휴게실 경험치 최적화 계산기
│       ├── boss-chase/    # 보스 물욕템 계산기
│       ├── origami/       # 색종이 이벤트 계산기
│       └── hangeul-medal/ # 한글날 훈장 계산기
├── features/              # 기능 단위 UI와 도메인 로직
│   ├── hunting/          # 사냥 기댓값·손익분기 계산기
│   ├── boss-chase/       # 보스 계산기 컴포넌트·데이터·로직
│   └── events/           # 종료 이벤트별 컴포넌트·계산 로직
├── components/            # 여러 기능에서 공유하는 React 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── providers/        # 전역 Provider
│   └── ui/               # 재사용 UI 컴포넌트
├── utils/                 # 기능에 종속되지 않는 공용 유틸리티
│   ├── slotStorage.ts    # 슬롯 저장 및 공유 문자열 직렬화
│   ├── cookies.ts        # 데이터 사용 동의 관리
│   └── formatUtils.ts    # 공용 숫자 포맷
├── lib/                   # 분석·블로그·외부 연동 모듈
├── hooks/               # 커스텀 React Hook
└── content/blog/        # Markdown 블로그 콘텐츠
```

설정 가이드, 연구 자료, 유지보수 문서는 `docs/` 아래에서 관리합니다.

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

### 폰트 라이선스

이 프로젝트에는 메이플스토리가 제공한 메이플스토리 서체가 적용되어 있습니다. 메이플스토리 서체는 넥슨의 지적재산권으로 보호받으며, 다음 조건 하에 사용됩니다:

- 서체의 원본을 수정하거나 편집하지 않음
- 서체를 별도로 판매하지 않음
- 원본 저작권 고지를 포함
- 서체를 원본 그대로 사용

출처: [메이플스토리 공식 서체 제공 페이지](https://maplestory.nexon.com/Media/Font)

### 주요 라이선스 조건
- ❌ **코드 자체 판매 금지**: 코드 자체를 판매하는 형태로 활용 불가
- ✅ **소규모 재사용**: 코드 일부만 활용 시 코드 판매 금지 외 MIT 라이선스와 동일한 조건
- 📝 **대규모 재사용**: 코드 대량 활용 시 출처 표기 필수
- ⚠️ **무보증**: 소프트웨어 사용에 대한 어떠한 보증도 제공하지 않습니다

## 특징

- 📱 **반응형 디자인**: 모바일과 데스크탑에서 모두 최적화
- 🔒 **개인정보 보호**: 모든 계산이 브라우저에서 처리됨 (서버 저장 없음)
- 💾 **자동 저장**: 각 계산기별 5개 슬롯으로 설정 자동 저장/불러오기
- ⚡ **빠른 성능**: Next.js와 정적 생성으로 최적화
- 🎨 **모던 UI**: Tailwind CSS로 구현된 깔끔한 인터페이스
- 🔄 **데이터 마이그레이션**: 버전 업그레이드 시 기존 데이터 자동 호환
- ♿ **접근성**: 웹 접근성 가이드라인 준수
