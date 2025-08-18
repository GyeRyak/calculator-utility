# 보스 물욕템(Chase Items) 시스템 문서

> 내부 개발 및 관리용 문서입니다. 보스 물욕템 계산기의 데이터 구조와 시스템 설계를 정의합니다.

## 목차
1. [개요](#개요)
2. [보스 데이터](#보스-데이터)
3. [물욕템 데이터](#물욕템-데이터)
4. [드롭 테이블](#드롭-테이블)
5. [계산 로직](#계산-로직)
6. [데이터 관리 가이드](#데이터-관리-가이드)

## 개요

### 용어 정의
- **물욕템(Chase Item)**: 보스 몬스터에서 드롭되는 고가치 아이템 (칠흑 아이템, 연마석 등)
- **드롭률**: 아이템이 드롭될 확률 (백분율로 표시, 내부 계산은 소수점)
- **격파 인원수**: 보스 격파 시 참여 인원 (1인=솔로, N인=파티)
- **N분배**: 파티 격파 시 드롭 아이템을 N명이 나누는 시스템

### 시스템 특징
- 보스와 아이템 데이터는 사전 정의 (하드코딩)
- 드롭률과 가격은 기본값 제공하되 사용자 수정 가능
- 주간 단위 기댓값 계산
- 캐릭터별 보스 격파 리스트 관리

## 보스 데이터

### 지원 보스 목록

#### 주간 보스 (주 1회 입장 제한)
1. **스우** - 하드/익스트림
2. **데미안** - 하드
3. **가디언 엔젤 슬라임** - 노말/카오스
4. **루시드** - 노말/하드
5. **윌** - 노말/하드
6. **더스크** - 노말/카오스
7. **진 힐라** - 노말/하드
8. **듄켈** - 노말/하드
9. **선택받은 세렌** - 노말/하드/익스트림
10. **감시자 칼로스** - 이지/노말/카오스/익스트림
11. **카링** - 이지/노말/하드/익스트림
12. **림보** - 노말/하드
13. **발드릭스** - 노말/하드

#### 월간 보스 (월 1회 입장 제한)
1. **검은 마법사** - 하드/익스트림

#### 미출시 보스 (데이터 준비)
1. **최초의 대적자** - 이지/노말/하드/익스트림

## 물욕템 데이터

### 아이템 속성
```typescript
interface ChaseItem {
  id: string                          // 고유 식별자
  name: string                        // 아이템명
  category: 'pitched_boss' | 'dawn_boss' | 'radiant_boss' | 'ring_box' | 'grindstone' | 'exceptional' | 'misc_chase'  // 아이템 카테고리
  defaultDropRate: number            // 기본 드롭률 (0.02 = 2%)
  defaultPrice: number               // 기본 가격 (메소)
  isDropAffected: 'normal' | 'log' | 'none'  // 드롭률 증가 효과 적용 여부
}
```

### 주요 물욕템 목록

#### 아이템 카테고리
- **칠흑**: 칠흑의 보스 세트 아이템
- **반상**: 보스 반지 상자
- **여명**: 여명의 보스 세트 아이템
- **연마석**: 생명/신념의 연마석
- **광휘**: 광휘의 보스 세트 아이템
- **익셉**: 익셉셔널 해머
- **기타 물욕**: 루인 포스실드 등

#### 반지 상자 (반상)
반지 상자에서는 반지 또는 연마석이 드롭됩니다. 반지가 나올 경우 확률적으로 레벨이 결정됩니다.

```typescript
// 녹옥의 보스 반지 상자 (Lv1)
{ id: 'ring_box_lv1', name: '녹옥의 보스 반지 상자', category: 'ring_box', isDropAffected: 'normal' }

// 홍옥의 보스 반지 상자 (Lv2)
{ id: 'ring_box_lv2', name: '홍옥의 보스 반지 상자', category: 'ring_box', isDropAffected: 'normal' }

// 흑옥의 보스 반지 상자 (Lv3)
{ id: 'ring_box_lv3', name: '흑옥의 보스 반지 상자', category: 'ring_box', isDropAffected: 'normal' }

// 백옥의 보스 반지 상자 (Lv4)
{ id: 'ring_box_lv4', name: '백옥의 보스 반지 상자', category: 'ring_box', isDropAffected: 'normal' }

// 생명의 보스 반지 상자 (Lv5)
{ id: 'ring_box_lv5', name: '생명의 보스 반지 상자', category: 'ring_box', isDropAffected: 'normal' }
```

##### 반지 상자 내용물 및 확률

**녹옥의 보스 반지 상자 (Lv1)**
- 리스트레인트 링: 2.11268% × 3레벨: 9% = 0.19014%
- 컨티뉴어스 링: 2.11268% × 3레벨: 9% = 0.19014%
- 기타 무효 아이템: 나머지 확률

**홍옥의 보스 반지 상자 (Lv2)**
- 리스트레인트 링: 6.92308% × (3레벨: 20% + 4레벨: 10%) = 2.07692%
- 컨티뉴어스 링: 6.92308% × (3레벨: 20% + 4레벨: 10%) = 2.07692%
- 기타 무효 아이템: 나머지 확률

**흑옥의 보스 반지 상자 (Lv3)**
- 리스트레인트 링: 12.5% × (3레벨: 30% + 4레벨: 20%) = 6.25%
- 컨티뉴어스 링: 12.5% × (3레벨: 30% + 4레벨: 20%) = 6.25%
- 기타 무효 아이템: 나머지 확률

**백옥의 보스 반지 상자 (Lv4)**
- 리스트레인트 링: 14.28571% × (3레벨: 65% + 4레벨: 35%) = 14.28571%
- 컨티뉴어스 링: 14.28571% × (3레벨: 65% + 4레벨: 35%) = 14.28571%
- 기타 무효 아이템: 나머지 확률

**생명의 보스 반지 상자 (Lv5)**
- 리스트레인트 링: 14.51613% × (3레벨: 30% + 4레벨: 70%) = 14.51613%
- 컨티뉴어스 링: 14.51613% × (3레벨: 30% + 4레벨: 70%) = 14.51613%
- 생명의 연마석: 14.51613%
- 기타 무효 아이템: 나머지 확률

##### 세부 확률 계산
```typescript
// 녹옥 (Lv1)
const greenRingBoxProbabilities = {
  restraint_lv3: 0.0211268 * 0.09,     // 0.19014%
  restraint_lv4: 0,                    // 없음
  continuous_lv3: 0.0211268 * 0.09,    // 0.19014%
  continuous_lv4: 0,                   // 없음
  grindstone: 0                         // 없음
}

// 홍옥 (Lv2) 
const redRingBoxProbabilities = {
  restraint_lv3: 0.0692308 * 0.20,     // 1.38462%
  restraint_lv4: 0.0692308 * 0.10,     // 0.69231%
  continuous_lv3: 0.0692308 * 0.20,    // 1.38462%
  continuous_lv4: 0.0692308 * 0.10,    // 0.69231%
  grindstone: 0                         // 없음
}

// 흑옥 (Lv3)
const blackRingBoxProbabilities = {
  restraint_lv3: 0.125 * 0.30,         // 3.75%
  restraint_lv4: 0.125 * 0.20,         // 2.50%
  continuous_lv3: 0.125 * 0.30,        // 3.75%
  continuous_lv4: 0.125 * 0.20,        // 2.50%
  grindstone: 0                         // 없음
}

// 백옥 (Lv4)
const whiteRingBoxProbabilities = {
  restraint_lv3: 0.1428571 * 0.65,     // 9.28571%
  restraint_lv4: 0.1428571 * 0.35,     // 5.00000%
  continuous_lv3: 0.1428571 * 0.65,    // 9.28571%
  continuous_lv4: 0.1428571 * 0.35,    // 5.00000%
  grindstone: 0                         // 없음
}

// 생명 (Lv5)
const lifeRingBoxProbabilities = {
  restraint_lv3: 0.1451613 * 0.30,     // 4.35484%
  restraint_lv4: 0.1451613 * 0.70,     // 10.16129%
  continuous_lv3: 0.1451613 * 0.30,    // 4.35484%
  continuous_lv4: 0.1451613 * 0.70,    // 10.16129%
  grindstone: 0.1451613                 // 14.51613%
}
```

#### 칠흑의 보스 세트 (Pitched Boss Set)
```typescript
// 스우 드롭
{ id: 'loose_control_machine_mark', name: '루즈 컨트롤 머신 마크', category: 'pitched_boss', isDropAffected: 'normal' }
{ id: 'complete_under_control', name: '컴플리트 언더컨트롤', category: 'pitched_boss', isDropAffected: 'normal' }

// 데미안 드롭
{ id: 'magic_eyepatch', name: '마력이 깃든 안대', category: 'pitched_boss', isDropAffected: 'normal' }

// 루시드 드롭
{ id: 'dreamy_belt', name: '몽환의 벨트', category: 'pitched_boss', isDropAffected: 'normal' }

// 윌 드롭
{ id: 'cursed_spellbook', name: '저주받은 마도서', category: 'pitched_boss', isDropAffected: 'normal' }

// 더스크 드롭
{ id: 'giant_terror', name: '거대한 공포', category: 'pitched_boss', isDropAffected: 'normal' }

// 진 힐라 드롭
{ id: 'source_of_suffering', name: '고통의 근원', category: 'pitched_boss', isDropAffected: 'normal' }

// 듄켈 드롭
{ id: 'commander_force_earring', name: '커맨더 포스 이어링', category: 'pitched_boss', isDropAffected: 'normal' }

// 검은 마법사 드롭
{ id: 'genesis_badge', name: '창세의 뱃지', category: 'pitched_boss', isDropAffected: 'normal' }

// 선택받은 세렌 드롭
{ id: 'mitras_rage', name: '미트라의 분노', category: 'pitched_boss', isDropAffected: 'normal' }
```

#### 여명의 보스 세트 (Dawn Boss Set)
```typescript
{ id: 'guardian_angel_ring', name: '가디언 엔젤 링', category: 'dawn_boss', isDropAffected: 'normal' }
{ id: 'twilight_mark', name: '트와일라이트 마크', category: 'dawn_boss', isDropAffected: 'normal' }
{ id: 'estella_earrings', name: '에스텔라 이어링', category: 'dawn_boss', isDropAffected: 'normal' }
{ id: 'daybreak_pendant', name: '데이브레이크 펜던트', category: 'dawn_boss', isDropAffected: 'normal' }
```

#### 연마석 (Grindstone)
```typescript
{ id: 'grindstone_lv5', name: '생명의 연마석', category: 'grindstone', isDropAffected: 'normal' }
{ id: 'grindstone_lv6', name: '신념의 연마석', category: 'grindstone', isDropAffected: 'normal' }
```

#### 광휘의 보스 세트 (Radiant Boss Set)
```typescript
{ id: 'whisper_of_origin', name: '근원의 속삭임', category: 'radiant_boss', isDropAffected: 'normal' }
{ id: 'oath_of_death', name: '죽음의 맹세', category: 'radiant_boss', isDropAffected: 'normal' }
```

#### 익셉셔널 해머 (Exceptional Hammer)
```typescript
{ id: 'exceptional_hammer_belt', name: '익셉셔널 해머 - 벨트', category: 'exceptional', isDropAffected: 'none' }
{ id: 'exceptional_hammer_face', name: '익셉셔널 해머 - 얼굴장식', category: 'exceptional', isDropAffected: 'none' }
{ id: 'exceptional_hammer_eye', name: '익셉셔널 해머 - 눈장식', category: 'exceptional', isDropAffected: 'none' }
{ id: 'exceptional_hammer_earring', name: '익셉셔널 해머 - 귀고리', category: 'exceptional', isDropAffected: 'none' }
```

#### 기타 물욕템 (Miscellaneous)
```typescript
{ id: 'ruin_force_shield', name: '루인 포스실드', category: 'misc_chase', isDropAffected: 'normal' }
```

## 드롭 테이블

### 보스별 드롭 테이블 정의
```typescript
interface DropTable {
  bossId: string
  difficulty: string
  items: string[]  // 아이템 ID 배열
}
```

### 실제 드롭 테이블 (물욕템만 포함)

#### 스우
```typescript
// 하드
{ bossId: 'suu', difficulty: 'hard', 
  items: ['loose_control_machine_mark', 'ring_box_lv2'] }

// 익스트림
{ bossId: 'suu', difficulty: 'extreme', 
  items: ['loose_control_machine_mark', 'complete_under_control', 'ring_box_lv4'] }
```

#### 데미안
```typescript
// 하드
{ bossId: 'damien', difficulty: 'hard', 
  items: ['magic_eyepatch', 'ruin_force_shield', 'ring_box_lv2'] }
```

#### 가디언 엔젤 슬라임
```typescript
// 노말
{ bossId: 'guardian_angel_slime', difficulty: 'normal', 
  items: ['guardian_angel_ring', 'ring_box_lv1'] }

// 카오스
{ bossId: 'guardian_angel_slime', difficulty: 'chaos', 
  items: ['guardian_angel_ring', 'ring_box_lv3'] }
```

#### 루시드
```typescript
// 노말
{ bossId: 'lucid', difficulty: 'normal', 
  items: ['twilight_mark', 'ring_box_lv1'] }

// 하드
{ bossId: 'lucid', difficulty: 'hard', 
  items: ['dreamy_belt', 'twilight_mark', 'ring_box_lv2'] }
```

#### 윌
```typescript
// 노말
{ bossId: 'will', difficulty: 'normal', 
  items: ['twilight_mark', 'ring_box_lv1'] }

// 하드
{ bossId: 'will', difficulty: 'hard', 
  items: ['cursed_spellbook', 'twilight_mark', 'ring_box_lv2'] }
```

#### 더스크
```typescript
// 노말
{ bossId: 'dusk', difficulty: 'normal', 
  items: ['estella_earrings', 'ring_box_lv1'] }

// 카오스
{ bossId: 'dusk', difficulty: 'chaos', 
  items: ['giant_terror', 'estella_earrings', 'ring_box_lv3'] }
```

#### 진 힐라
```typescript
// 노말
{ bossId: 'verus_hilla', difficulty: 'normal', 
  items: ['daybreak_pendant', 'ring_box_lv2'] }

// 하드
{ bossId: 'verus_hilla', difficulty: 'hard', 
  items: ['source_of_suffering', 'daybreak_pendant', 'ring_box_lv3'] }
```

#### 듄켈
```typescript
// 노말
{ bossId: 'dunkel', difficulty: 'normal', 
  items: ['estella_earrings', 'ring_box_lv1'] }

// 하드
{ bossId: 'dunkel', difficulty: 'hard', 
  items: ['commander_force_earring', 'estella_earrings', 'ring_box_lv3'] }
```

#### 검은 마법사 (월간)
```typescript
// 하드
{ bossId: 'black_mage', difficulty: 'hard', 
  items: ['genesis_badge', 'ring_box_lv4'] }

// 익스트림
{ bossId: 'black_mage', difficulty: 'extreme', 
  items: ['genesis_badge', 'exceptional_hammer_belt', 'ring_box_lv4'] }
```

#### 선택받은 세렌
```typescript
// 노말
{ bossId: 'chosen_seren', difficulty: 'normal', 
  items: ['daybreak_pendant', 'ring_box_lv3'] }

// 하드
{ bossId: 'chosen_seren', difficulty: 'hard', 
  items: ['mitras_rage', 'daybreak_pendant', 'ring_box_lv4'] }

// 익스트림
{ bossId: 'chosen_seren', difficulty: 'extreme', 
  items: ['mitras_rage', 'exceptional_hammer_face', 'daybreak_pendant', 'ring_box_lv4'] }
```

#### 감시자 칼로스
```typescript
// 이지
{ bossId: 'kalos', difficulty: 'easy', 
  items: ['ring_box_lv4'] }

// 노말
{ bossId: 'kalos', difficulty: 'normal', 
  items: ['grindstone_lv5', 'ring_box_lv4'] }

// 카오스
{ bossId: 'kalos', difficulty: 'chaos', 
  items: ['grindstone_lv5', 'ring_box_lv5'] }

// 익스트림
{ bossId: 'kalos', difficulty: 'extreme', 
  items: ['exceptional_hammer_eye', 'grindstone_lv5', 'ring_box_lv5'] }
```

#### 카링
```typescript
// 이지
{ bossId: 'kaling', difficulty: 'easy', 
  items: ['ring_box_lv4'] }

// 노말
{ bossId: 'kaling', difficulty: 'normal', 
  items: ['grindstone_lv5', 'ring_box_lv4'] }

// 하드
{ bossId: 'kaling', difficulty: 'hard', 
  items: ['grindstone_lv5', 'ring_box_lv5'] }

// 익스트림
{ bossId: 'kaling', difficulty: 'extreme', 
  items: ['exceptional_hammer_earring', 'grindstone_lv5', 'ring_box_lv5'] }
```

#### 림보
```typescript
// 노말
{ bossId: 'limbo', difficulty: 'normal', 
  items: ['grindstone_lv6', 'ring_box_lv5'] }

// 하드
{ bossId: 'limbo', difficulty: 'hard', 
  items: ['whisper_of_origin', 'grindstone_lv6', 'ring_box_lv5'] }
```

#### 발드릭스
```typescript
// 노말
{ bossId: 'baldrex', difficulty: 'normal', 
  items: ['grindstone_lv6', 'ring_box_lv5'] }

// 하드
{ bossId: 'baldrex', difficulty: 'hard', 
  items: ['oath_of_death', 'grindstone_lv6', 'ring_box_lv5'] }
```

## 계산 로직

### 기댓값 계산 공식

#### 1. 단일 아이템 기댓값
```typescript
// 일반 아이템 (솔로 격파 시)
const expectedValue = dropRate * itemPrice

// 일반 아이템 (N인 파티 격파 시)
const expectedValue = (dropRate * itemPrice) / partySize

// 반지 상자 기댓값 계산
const calculateRingBoxExpectedValue = (ringBoxId: string, ringBoxDropRate: number, ringPrices: RingPrices, grindstonePrice?: number) => {
  const probabilities = getRingBoxProbabilities(ringBoxId)
  
  const ringExpectedValue = 
    probabilities.restraint_lv3 * ringPrices.restraint_lv3 +
    probabilities.restraint_lv4 * ringPrices.restraint_lv4 +
    probabilities.continuous_lv3 * ringPrices.continuous_lv3 +
    probabilities.continuous_lv4 * ringPrices.continuous_lv4 +
    (probabilities.grindstone || 0) * (grindstonePrice || 0)  // 생명 반지상자의 연마석
  
  return ringBoxDropRate * ringExpectedValue
}

// 반지 상자별 고정 확률 반환
const getRingBoxProbabilities = (ringBoxId: string) => {
  const probabilities = {
    ring_box_lv1: {  // 녹옥
      restraint_lv3: 0.0211268 * 0.09,
      restraint_lv4: 0,
      continuous_lv3: 0.0211268 * 0.09,
      continuous_lv4: 0,
      grindstone: 0
    },
    ring_box_lv2: {  // 홍옥
      restraint_lv3: 0.0692308 * 0.20,
      restraint_lv4: 0.0692308 * 0.10,
      continuous_lv3: 0.0692308 * 0.20,
      continuous_lv4: 0.0692308 * 0.10,
      grindstone: 0
    },
    ring_box_lv3: {  // 흑옥
      restraint_lv3: 0.125 * 0.30,
      restraint_lv4: 0.125 * 0.20,
      continuous_lv3: 0.125 * 0.30,
      continuous_lv4: 0.125 * 0.20,
      grindstone: 0
    },
    ring_box_lv4: {  // 백옥
      restraint_lv3: 0.1428571 * 0.65,
      restraint_lv4: 0.1428571 * 0.35,
      continuous_lv3: 0.1428571 * 0.65,
      continuous_lv4: 0.1428571 * 0.35,
      grindstone: 0
    },
    ring_box_lv5: {  // 생명
      restraint_lv3: 0.1451613 * 0.30,
      restraint_lv4: 0.1451613 * 0.70,
      continuous_lv3: 0.1451613 * 0.30,
      continuous_lv4: 0.1451613 * 0.70,
      grindstone: 0.1451613
    }
  }
  
  return probabilities[ringBoxId] || probabilities.ring_box_lv1
}

interface RingBoxProbabilities {
  restraint_lv3: number    // 리스트레인트 링 3레벨 확률
  restraint_lv4: number    // 리스트레인트 링 4레벨 확률
  continuous_lv3: number   // 컨티뉴어스 링 3레벨 확률
  continuous_lv4: number   // 컨티뉴어스 링 4레벨 확률
  grindstone: number       // 연마석 확률 (생명 반지상자만)
}

interface RingPrices {
  restraint_lv3: number    // 리스트레인트 링 3레벨 가격
  restraint_lv4: number    // 리스트레인트 링 4레벨 가격
  continuous_lv3: number   // 컨티뉴어스 링 3레벨 가격
  continuous_lv4: number   // 컨티뉴어스 링 4레벨 가격
}
```

#### 2. 드롭률 증가 효과 적용
```typescript
// normal 타입 아이템만 적용 (1차 구현)
if (item.isDropAffected === 'normal') {
  const actualDropRate = baseDropRate * (1 + dropRateBonus / 100)
}
```

#### 3. 주간 기댓값
```typescript
// 캐릭터별 주간 기댓값
const weeklyExpectation = sumOfAllBossExpectations

// 전체 주간 기댓값
const totalWeeklyExpectation = sumOfAllCharacterExpectations
```

### 파티 분배 로직
```typescript
interface PartyDistribution {
  partySize: number  // 격파 인원수
  distributionType: 'equal'  // 균등 분배 (향후 확장 가능)
}

// 기댓값 = (드롭률 * 아이템 가치) / 파티 인원수
```

## 데이터 관리 가이드

### 새 보스 추가 시
1. `/src/data/bossData.ts`에 보스 정의 추가
2. `/src/data/dropTables.ts`에 드롭 테이블 추가
3. 필요 시 `/src/data/chaseItems.ts`에 새 아이템 추가
4. 기본 드롭률과 가격 설정

### 아이템 추가 시
1. `/src/data/chaseItems.ts`에 아이템 정의
2. 해당 보스의 드롭 테이블에 아이템 ID 추가
3. `isDropAffected` 속성 정확히 설정
4. 기본값(드롭률, 가격) 설정

### 캐릭터 프리셋 추가
```typescript
interface CharacterPreset {
  id: string
  name: string  // 예: "검밑솔"
  description?: string
  characters: [
    {
      name: '메인 캐릭터',
      bossList: [
        { bossId: 'will', difficulty: 'extreme', partySize: 1 },
        { bossId: 'guardian_angel_slime', difficulty: 'chaos', partySize: 2 }
      ]
    },
    {
      name: '부캐릭터 1',
      bossList: [
        { bossId: 'will', difficulty: 'hard', partySize: 1 },
        { bossId: 'guardian_angel_slime', difficulty: 'normal', partySize: 1 }
      ]
    }
  ]
}
```

## UI 설계

### 반지 상자 설정 UI
사용자가 반지 상자의 기댓값을 설정할 수 있는 UI 구성:

#### 1. 반지 확률 정보 표시 섹션
반지 상자별 고정 확률 정보를 표시 (사용자 수정 불가):

```typescript
// 반지 상자별 고정 확률 표시 (읽기 전용)
interface RingProbabilityDisplay {
  ringBoxName: string      // 반지 상자 이름
  restraint_lv3: string    // 리스트레인트 링 3레벨 확률 (표시용)
  restraint_lv4: string    // 리스트레인트 링 4레벨 확률 (표시용)
  continuous_lv3: string   // 컨티뉴어스 링 3레벨 확률 (표시용)
  continuous_lv4: string   // 컨티뉴어스 링 4레벨 확률 (표시용)
  grindstone?: string      // 연마석 확률 (생명 반지상자만)
}
```

#### 2. 반지 가격 설정 섹션
```typescript
// 반지별 가격 설정
interface RingPriceInputs {
  restraint_lv3: string    // 리스트레인트 링 3레벨 가격 (메소, 포맷팅)
  restraint_lv4: string    // 리스트레인트 링 4레벨 가격 (메소, 포맷팅)
  continuous_lv3: string   // 컨티뉴어스 링 3레벨 가격 (메소, 포맷팅)
  continuous_lv4: string   // 컨티뉴어스 링 4레벨 가격 (메소, 포맷팅)
}
```

#### 3. 실시간 기댓값 표시
- 각 반지 상자별 실시간 기댓값 계산
- 확률 변경 시 즉시 반영
- 가격 변경 시 즉시 반영

#### 4. 검증 로직
- 가격 0 이상 검증
- 숫자 입력 형식 검증
- 연마석 가격 별도 검증 (생명 반지상자용)

## 향후 확장 계획

### Phase 1 (현재 구현)
- [ ] 전체 보스 14종 지원 (주간 13종 + 월간 1종)
- [ ] normal 타입 아이템 지원 (칠흑, 반상, 여명, 연마석, 광휘, 기타)
- [ ] 반지 상자 기댓값 계산 시스템
- [ ] none 타입 아이템 제외 (익셉셔널 해머)
- [ ] 주간/월간 기댓값 계산
- [ ] AutoSlotManager 통합

### Phase 2 (계획)
- [ ] 드롭률 영향 받지 않는 아이템 지원 (none 타입)
- [ ] 로그 스케일 드롭률 아이템 지원 (log 타입)
- [ ] 손익분기 계산기 실시간 연동
- [ ] 추가 보스 지원

### Phase 3 (미래)
- [ ] 월간/연간 기댓값 계산
- [ ] 보스별 격파 횟수 커스터마이징
- [ ] 드래그 앤 드롭 캐릭터 순서 변경
- [ ] 시뮬레이션 모드 (드롭률 변동 시나리오)

## 데이터 저장 구조

### localStorage 키
```
boss_chase_calculator_slot_1
boss_chase_calculator_slot_2
boss_chase_calculator_slot_3
boss_chase_calculator_slot_4
boss_chase_calculator_slot_5
```

### 저장 데이터 형식
```typescript
interface SavedData {
  version: 1,
  characters: CharacterConfig[],
  customDropRates: { [itemId: string]: number },
  customPrices: { [itemId: string]: number },
  ringPrices: RingPrices,               // 반지별 가격 설정 (확률은 고정)
  grindstonePrice: number,              // 생명의 연마석 가격
  lastModified: string  // ISO timestamp
}

// 반지별 가격 (사용자 설정)
interface RingPrices {
  restraint_lv3: number    // 리스트레인트 링 3레벨 가격 (기본값: 50,000,000,000)
  restraint_lv4: number    // 리스트레인트 링 4레벨 가격 (기본값: 200,000,000,000)
  continuous_lv3: number   // 컨티뉴어스 링 3레벨 가격 (기본값: 30,000,000,000)
  continuous_lv4: number   // 컨티뉴어스 링 4레벨 가격 (기본값: 150,000,000,000)
}

// 기본값 상수
const DEFAULT_RING_PRICES: RingPrices = {
  restraint_lv3: 50_000_000_000,    // 500억
  restraint_lv4: 200_000_000_000,   // 2000억
  continuous_lv3: 30_000_000_000,   // 300억
  continuous_lv4: 150_000_000_000   // 1500억
}

const DEFAULT_GRINDSTONE_PRICE = 5_000_000_000  // 50억 (생명의 연마석)
```

## 손익분기 계산기 연동

### 데이터 읽기
```typescript
// 손익분기 계산기에서 물욕템 데이터 읽기
const getBossChaseData = (slotNumber: number) => {
  const key = `boss_chase_calculator_slot_${slotNumber}`
  const data = localStorage.getItem(key)
  if (!data) return null
  
  const parsed = JSON.parse(data)
  // 주간 기댓값을 시간당으로 변환 가능
  return {
    weeklyExpectation: parsed.totalWeeklyExpectation,
    hourlyExpectation: parsed.totalWeeklyExpectation / 168  // 주 168시간
  }
}
```

---

*이 문서는 보스 물욕템 계산기 개발 및 유지보수를 위한 내부 참조 문서입니다.*
## 드롭률 적용 규칙

### 드롭률 증가 효과가 적용되는 아이템 (isDropAffected: 'normal')
- 칠흑의 보스 세트 (미트라의 분노 포함)
- 여명의 보스 세트
- 광휘의 보스 세트
- 보스 반지 상자 (녹옥, 홍옥, 흑옥, 백옥, 생명)
- 연마석 (생명, 신념)
- 기타 물욕템 (루인 포스실드 등)

### 드롭률 증가 효과가 적용되지 않는 아이템 (isDropAffected: 'none')
- 익셉셔널 해머 전체
- 환생의 불꽃류
- 주문서류
- 도핑류
- 방어구/무기 상자류
- 강렬한 힘의 결정
- 솔 에르다의 기운
- 주문의 흔적

---

*이 문서는 보스 물욕템 계산기 개발 및 유지보수를 위한 내부 참조 문서입니다.*
*최종 업데이트: 2025-08-13*