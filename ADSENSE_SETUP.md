# Google AdSense 설정 가이드

## 개요

이 프로젝트에 Google AdSense 수동 광고가 성공적으로 통합되었습니다. 아래 단계에 따라 실제 광고 단위 ID로 교체하세요.

## 현재 광고 배치 위치

### 1. 메인 페이지 (`src/app/page.tsx`)
- **위치**: Hero 섹션 아래, 계산기 그리드 위
- **광고 타입**: 배너 (AdSenseBanner)
- **현재 슬롯 ID**: `1122334455`
- **용도**: 첫 페이지 진입 시 최대 노출

### 2. 블로그 페이지 (`src/components/blog/BlogPostContent.tsx`)
- **위치 1**: 목차 아래
  - **광고 타입**: 인피드 (AdSenseInArticle)
  - **현재 슬롯 ID**: `1234567890`
- **위치 2**: 댓글창 위
  - **광고 타입**: 인피드 (AdSenseInArticle)
  - **현재 슬롯 ID**: `0987654321`

### 3. 계산기 페이지들 (최하단, 푸터 위)
- **사냥 기댓값 계산기** (`src/app/calculators/basic/page.tsx`)
  - 슬롯 ID: `2233445566`
- **손익분기 계산기** (`src/app/calculators/breakeven/page.tsx`)
  - 슬롯 ID: `3344556677`
- **보스 물욕템 계산기** (`src/app/calculators/boss-chase/page.tsx`)
  - 슬롯 ID: `4455667788`
- **휴게실 최적화 계산기** (`src/app/calculators/lounge/page.tsx`)
  - 슬롯 ID: `5566778899`
- **오리가미 계산기** (`src/app/calculators/origami/page.tsx`)
  - 슬롯 ID: `6677889900`

## AdSense 광고 단위 생성 및 ID 교체 방법

### 1단계: AdSense 계정에 로그인
[Google AdSense](https://adsense.google.com/)에 접속하여 로그인합니다.

### 2단계: 광고 단위 생성
1. 좌측 메뉴에서 **광고 > 광고 단위** 선택
2. **광고 단위 만들기** 클릭
3. 광고 유형 선택:
   - **디스플레이 광고**: 계산기 페이지용
   - **인피드 광고**: 블로그 글 내부용
   - **배너 광고**: 메인 페이지용

### 3단계: 광고 단위 설정
- **광고 단위 이름**: 위치별로 명확하게 (예: "메인페이지 배너", "블로그 목차 아래" 등)
- **광고 크기**: 반응형 권장
- **광고 형식**: 텍스트 및 디스플레이 광고

### 4단계: 생성된 슬롯 ID 확인
광고 단위 생성 후 다음과 같은 코드가 제공됩니다:
```html
<ins class="adsbygoogle"
     data-ad-client="ca-pub-6146739804286620"
     data-ad-slot="1234567890">  <!-- 이 부분이 슬롯 ID -->
</ins>
```

### 5단계: 코드에서 슬롯 ID 교체

#### 예시: 메인 페이지 배너 광고
파일: `src/app/page.tsx`

**변경 전:**
```tsx
<AdSenseBanner adSlot="1122334455" />
```

**변경 후:**
```tsx
<AdSenseBanner adSlot="실제_광고_단위_ID" />
```

### 6단계: 모든 페이지에서 반복
위의 "현재 광고 배치 위치" 섹션을 참고하여 각 파일에서 해당 슬롯 ID를 실제 ID로 교체하세요.

## 광고 성능 최적화 기능

### CLS(Cumulative Layout Shift) 방지
- 모든 광고 컨테이너에 `minHeight` 사전 설정
- 광고 로드 전 레이아웃 공간 확보

### 초기 로딩 성능 보호
- `next/script`의 `afterInteractive` 전략 사용
- 페이지 초기 렌더링 후 광고 스크립트 로드
- FCP(First Contentful Paint) 및 LCP(Largest Contentful Paint) 영향 최소화

### Lazy Loading
- Intersection Observer로 뷰포트 진입 시에만 광고 활성화
- 200px 전 미리 로드 시작으로 자연스러운 UX

## 테스트 및 모니터링

### 로컬 테스트
```bash
npm run build
npm run start
```

### 확인 사항
1. 광고가 올바르게 표시되는지 확인
2. 레이아웃 시프트가 발생하지 않는지 확인
3. 페이지 로딩 속도 영향 확인 (PageSpeed Insights)

### 성능 지표 모니터링
- **CLS**: < 0.1 목표
- **LCP**: < 2.5초 목표
- **광고 조회가능 노출 비율**: AdSense 대시보드에서 확인

## 광고 정책 준수

### 금지 사항
- 광고를 강제로 클릭하도록 유도하지 마세요
- "광고 클릭" 등의 문구 사용 금지
- 광고와 콘텐츠를 명확히 구분

### 권장 사항
- "Advertisement" 라벨 유지 (이미 적용됨)
- 광고와 콘텐츠 사이 적절한 간격 유지 (이미 적용됨)
- 사용자 경험을 최우선으로 고려

## 문제 해결

### 광고가 표시되지 않는 경우
1. AdSense 계정 승인 상태 확인
2. 광고 단위 ID가 올바른지 확인
3. 브라우저 콘솔에서 에러 메시지 확인
4. 광고 차단 프로그램 비활성화 후 테스트

### 성능 문제가 발생하는 경우
1. PageSpeed Insights로 병목 지점 확인
2. 광고 개수 조정 고려
3. Lazy Loading 범위 조정 (`rootMargin` 값 변경)

## 추가 정보

### 광고 컴포넌트 파일
- `src/components/ads/AdSenseUnit.tsx`: 기본 광고 단위
- `src/components/ads/AdSenseBanner.tsx`: 배너형 광고
- `src/components/ads/AdSenseInArticle.tsx`: 인피드 광고
- `src/components/AdSenseScript.tsx`: 스크립트 로더

### 관련 문서
- [Google AdSense 고객센터](https://support.google.com/adsense/)
- [광고 게재 정책](https://support.google.com/adsense/answer/48182)
- [광고 단위 관리](https://support.google.com/adsense/answer/9274025)