// 계산 결과 내보내기 유틸리티 함수들
import { formatNumber, formatMesoWithKorean, formatDecimal } from './formatUtils'
import { getMonsterPerTimeStr, getHuntTimeStr, type TimeUnitCode } from './timeUnitUtils'

/**
 * 기본 계산기 결과 데이터 인터페이스
 */
export interface BasicCalculatorExportData {
  // 기본 설정
  monsterLevel: number
  characterLevel: number
  monsterCount: number
  huntTime: number
  huntTimeUnit: TimeUnitCode
  resultTime: number
  resultTimeUnit: TimeUnitCode
  isCustomResultTime: boolean
  
  // 메소 관련
  mesoBonus: number
  mesoPotentialLines: number // 메획 잠재 줄 수
  baseMeso: number
  baseMesoPerHour: number // 순수 메소 드롭 (시간당)
  totalMesoPerHour: number // 총 수익 (메소 + 드롭 아이템 - 재획비)
  totalMesoWithoutPotion: number
  wealthAcquisitionPotion: boolean
  wealthAcquisitionPotionCost?: number
  
  // 드롭 관련
  dropRate: number
  dropRatePotentialLines: number // 아드 잠재 줄 수
  totalIncome: number
  
  // 드롭 아이템 (상위 5개만)
  topDropItems: Array<{
    name: string
    expectedCount: number
    expectedValue: number
    actualDropRate: number
  }>
  
  // 계산 일시
  calculatedAt: string
}

/**
 * 손익분기 계산기 결과 데이터 인터페이스
 */
export interface BreakevenCalculatorExportData {
  // 기본 설정
  materialsPerDay: number
  mesoLimitEnabled?: boolean  // 메소 제한 활성화 여부
  mesoLimitHours?: number     // 메소 제한 시간 (시)
  mesoLimitMinutes?: number   // 메소 제한 시간 (분)
  globalFeeRate: 3 | 5
  
  // 기본 계산기 정보
  baseCalculation: {
    monsterLevel: number
    characterLevel: number
    huntTime: number
    mesoBonus: number
    mesoPotentialLines: number // 메획 잠재 줄 수
    dropRate: number
    dropRatePotentialLines: number // 아드 잠재 줄 수
    totalIncomePerHour: number
  }
  
  // 손익분기 아이템들
  items: Array<{
    name: string
    dropLines: number
    mesoLines: number
    purchasePrice: number
    sellPrice: number
    netCost: number
    breakEvenHours: number
    daysToBreakeven: number
    formattedPeriod: string
    increasePerHour: number // 시간당 증가 수익
  }>
  
  // 전체 아이템 구매 시 총 결과
  totalResult: {
    netCost: number // 총 순 투자 비용
    increasePerHour: number // 시간당 총 증가 수익
    breakEvenMaterials: number // 손익분기 소재
    formattedPeriod: string // 손익분기 기간
    totalDropLines: number // 총 드롭 잠재 줄 수
    totalMesoLines: number // 총 메획 잠재 줄 수
  }
  
  // 계산 일시
  calculatedAt: string
}

/**
 * Canvas를 사용해 이미지 생성
 */
export function generateImageFromData(
  data: BasicCalculatorExportData | BreakevenCalculatorExportData,
  type: 'basic' | 'breakeven'
): Promise<Blob> {
  return new Promise(async (resolve) => {
    // 메이플스토리 폰트 로드 대기
    try {
      await document.fonts.load('16px "Maplestory"')
      await document.fonts.load('bold 18px "Maplestory"')
      console.log('메이플스토리 폰트 로드 완료')
    } catch (error) {
      console.warn('메이플스토리 폰트 로드 실패, 기본 폰트 사용:', error)
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // 캔버스 크기 설정 (세로는 가변)
    const width = 450
    let estimatedHeight = type === 'basic' ? 400 : 600 // 초기 예상 높이
    canvas.width = width
    canvas.height = estimatedHeight
    
    // 깔끔한 배경색
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, estimatedHeight)
    
    // 상단 헤더 영역
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, width, 50)
    
    // 폰트 설정
    const mapleFont = '"Maplestory", "Noto Sans KR", "Noto Sans", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Apple Gothic", "Malgun Gothic", "맑은 고딕", Dotum, "돋움", Gulim, "굴림", sans-serif' // 메이플 폰트 (제목, 중요 텍스트용)
    const defaultFont = '"Noto Sans KR", "Noto Sans", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Apple Gothic", "Malgun Gothic", "맑은 고딕", Dotum, "돋움", Gulim, "굴림", sans-serif' // 기본 폰트 (본문, 일반 텍스트용)
    ctx.fillStyle = '#000000'
    
    let y = 35
    const lineHeight = 24
    const sectionGap = 20
    
    // 헤더 (메이플 폰트)
    ctx.font = `bold 18px ${mapleFont}`
    ctx.fillStyle = '#1e40af'
    const title = type === 'basic' ? '📊 사냥 기댓값 계산 결과' : '📊 드메템 손익분기 계산 결과'
    const titleWidth = ctx.measureText(title).width
    ctx.fillText(title, (width - titleWidth) / 2, y)
    y += 35
    
    
    ctx.font = `14px ${defaultFont}`
    ctx.fillStyle = '#374151'
    
    if (type === 'basic') {
      const basicData = data as BasicCalculatorExportData
      const huntTimeStr = getHuntTimeStr(basicData.huntTime, basicData.huntTimeUnit, basicData.isCustomResultTime, basicData.resultTime, basicData.resultTimeUnit)
      const monsterPerTimeStr = getMonsterPerTimeStr(basicData.huntTime, basicData.huntTimeUnit, basicData.monsterCount)
      
      // 핵심 요약 정보 (기본 폰트)
      ctx.font = `bold 14px ${defaultFont}`
      ctx.fillStyle = '#1f2937'
      const dropRateText = basicData.dropRatePotentialLines > 0 ? `아드 ${Math.round(basicData.dropRate)}% (잠재 ${basicData.dropRatePotentialLines}줄)` : `아드 ${Math.round(basicData.dropRate)}%`
      const mesoRateText = basicData.mesoPotentialLines > 0 ? `메획 ${Math.round(basicData.mesoBonus)}% (잠재 ${basicData.mesoPotentialLines}줄)` : `메획 ${Math.round(basicData.mesoBonus)}%`
      ctx.fillText(`${dropRateText}, ${mesoRateText}인 ${basicData.characterLevel}레벨 캐릭터가`, 20, y)
      y += lineHeight + 3
      ctx.fillText(`${basicData.monsterLevel}레벨 몬스터를 ${monsterPerTimeStr}씩 ${huntTimeStr} 사냥하면?`, 20, y)
      y += sectionGap + 10
      
      // 총 수익 (메이플 폰트 - 중요한 결과)
      ctx.font = `bold 18px ${mapleFont}`
      ctx.fillStyle = '#059669'
      ctx.fillText(`💰 총 ${formatMesoWithKorean(basicData.totalIncome)} 메소`, 20, y)
      y += sectionGap + 10
      
      // 상세 내역 제목 (메이플 폰트)
      ctx.font = `bold 14px ${mapleFont}`
      ctx.fillStyle = '#374151'
      ctx.fillText('📦 세부 내역:', 20, y)
      y += lineHeight + 5
      
      // 상세 내역 본문 (기본 폰트)
      ctx.font = `12px ${defaultFont}`
      ctx.fillText(`• 드롭 메소: ${formatMesoWithKorean(basicData.baseMeso)} 메소`, 30, y)
      y += lineHeight
      
      // 솔 에르다 조각 찾기
      const solErdaItem = basicData.topDropItems.find(item => item.name.includes('솔 에르다 조각'))
      if (solErdaItem) {
        ctx.fillText(`• 솔 에르다 조각: ${formatDecimal(solErdaItem.expectedCount)}개 (${formatMesoWithKorean(solErdaItem.expectedValue)} 메소)`, 30, y)
        y += lineHeight
      }
      
      // 기타 드롭 (수익순 정렬, 상위 3개 표시)
      const allOtherItems = basicData.topDropItems.filter(item => !item.name.includes('솔 에르다 조각'))
      if (allOtherItems.length > 0) {
        // 전체 기타 드롭의 총합 계산
        const otherTotal = allOtherItems.reduce((sum, item) => sum + item.expectedValue, 0)
        
        // 표시할 상위 3개 아이템
        const topOtherItems = allOtherItems
          .sort((a, b) => b.expectedValue - a.expectedValue) // 수익순 내림차순 정렬
          .slice(0, 3)
        
        // 기타 드롭 제목과 상위 3개 표시 문구를 한 줄에
        ctx.fillText(`• 기타 드롭: ${formatMesoWithKorean(otherTotal)} 메소`, 30, y)
        
        if (allOtherItems.length > 3) {
          ctx.font = `9px ${defaultFont}`
          ctx.fillStyle = '#9ca3af'
          ctx.fillText(`(상위 ${Math.min(3, topOtherItems.length)}개만 표시)`, 250, y)
          ctx.font = `12px ${defaultFont}`
          ctx.fillStyle = '#374151'
        }
        
        y += lineHeight
        
        topOtherItems.forEach((item, index) => {
          ctx.fillText(`  ${index + 1}. ${item.name}: ${formatDecimal(item.expectedCount)}개`, 40, y)
          y += lineHeight
        })
      }
      
      if (basicData.wealthAcquisitionPotion && basicData.wealthAcquisitionPotionCost) {
        ctx.fillText(`• 재획비 비용: -${formatMesoWithKorean(basicData.wealthAcquisitionPotionCost)} 메소`, 30, y)
        y += lineHeight
      }
      
    } else {
      const breakevenData = data as BreakevenCalculatorExportData
      
      // 핵심 요약 정보 (기본 폰트)
      ctx.font = `bold 14px ${defaultFont}`
      ctx.fillStyle = '#1f2937'
      // 기본 계산기와 동일한 형식으로 드롭률/메획 표시 (정수로 반올림, 잠재 줄 수 포함)
      const dropRateText = breakevenData.baseCalculation.dropRatePotentialLines > 0 
        ? `아드 ${Math.round(breakevenData.baseCalculation.dropRate)}% (잠재 ${breakevenData.baseCalculation.dropRatePotentialLines}줄)` 
        : `아드 ${Math.round(breakevenData.baseCalculation.dropRate)}%`
      const mesoRateText = breakevenData.baseCalculation.mesoPotentialLines > 0 
        ? `메획 ${Math.round(breakevenData.baseCalculation.mesoBonus)}% (잠재 ${breakevenData.baseCalculation.mesoPotentialLines}줄)` 
        : `메획 ${Math.round(breakevenData.baseCalculation.mesoBonus)}%`
      ctx.fillText(`${dropRateText}, ${mesoRateText}인 ${breakevenData.baseCalculation.characterLevel}레벨 캐릭터`, 20, y)
      y += lineHeight + 3
      
      // 기준 설정 (소재 vs 메소제한)
      if (breakevenData.mesoLimitEnabled && breakevenData.mesoLimitHours !== undefined) {
        const hours = breakevenData.mesoLimitHours
        const minutes = breakevenData.mesoLimitMinutes || 0
        if (minutes > 0) {
          ctx.fillText(`매일 메소제한(${hours}시간 ${minutes}분), 수수료 ${breakevenData.globalFeeRate}% 기준`, 20, y)
        } else {
          ctx.fillText(`매일 메소제한(${hours}시간), 수수료 ${breakevenData.globalFeeRate}% 기준`, 20, y)
        }
      } else {
        ctx.fillText(`매일 ${breakevenData.materialsPerDay}소재, 수수료 ${breakevenData.globalFeeRate}% 기준`, 20, y)
      }
      y += lineHeight + 5
      
      // 전체 아이템 구매 시 총 결과 (메이플 폰트 - 중요한 정보)
      ctx.font = `bold 14px ${mapleFont}`
      ctx.fillStyle = '#1e40af'
      ctx.fillText('💎 전체 아이템 구매 시:', 20, y)
      y += lineHeight + 5
      
      ctx.font = `12px ${defaultFont}`
      ctx.fillStyle = '#374151'
      ctx.fillText(`• 총 잠재: 아드 ${breakevenData.totalResult.totalDropLines}줄, 메획 ${breakevenData.totalResult.totalMesoLines}줄`, 30, y)
      y += lineHeight
      ctx.fillText(`• 총 순 투자 비용: ${formatMesoWithKorean(breakevenData.totalResult.netCost * 100000000)} 메소`, 30, y)
      y += lineHeight
      ctx.fillStyle = '#059669'
      ctx.fillText(`• 시간당 총 증가 수익: ${formatMesoWithKorean(breakevenData.totalResult.increasePerHour)} 메소`, 30, y)
      y += lineHeight
      ctx.fillStyle = '#dc2626'
      ctx.fillText(`• 손익분기: ${breakevenData.totalResult.formattedPeriod}`, 30, y)
      y += sectionGap + 10
      
      // 아이템별 손익분기 제목 (메이플 폰트)
      ctx.font = `bold 14px ${mapleFont}`
      ctx.fillStyle = '#374151'
      ctx.fillText('💎 아이템별 손익분기:', 20, y)
      y += lineHeight + 10
      
      // 아이템 목록 (기본 폰트)
      ctx.font = `12px ${defaultFont}`
      breakevenData.items.forEach((item, index) => {
        // 아이템명과 손익분기 (메이플 폰트 - 중요한 정보)
        ctx.font = `bold 12px ${mapleFont}`
        ctx.fillText(`• ${item.name}: ${item.formattedPeriod}`, 30, y)
        y += lineHeight
        // 세부 정보 (기본 폰트)
        ctx.font = `11px ${defaultFont}`
        ctx.fillStyle = '#6b7280'
        // 잠재 줄 수를 간단하게 표시: "드"*드롭줄수 + "메"*메획줄수
        const potentialText = "드".repeat(item.dropLines) + "메".repeat(item.mesoLines)
        ctx.fillText(`  ${potentialText} | ${item.purchasePrice.toFixed(1)}억 구매, ${item.sellPrice.toFixed(1)}억 판매로 ${item.netCost.toFixed(1)}억 지불`, 30, y)
        y += lineHeight
        ctx.fillText(`  시간당 증가 수익: ${formatMesoWithKorean(item.increasePerHour)} 메소`, 30, y)
        y += lineHeight + 5
        ctx.fillStyle = '#374151'
      })
    }
    
    // 실제 필요한 높이 계산
    const actualHeight = y + 60 // 하단 여백 60px 추가
    
    // 캔버스 크기 재조정
    canvas.height = actualHeight
    
    // 배경 다시 그리기 (크기가 변경되었으므로)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, actualHeight)
    
    // 상단 헤더 영역
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, width, 50)
    
    // 모든 내용을 다시 그리기 위해 y를 초기화하고 다시 그리기
    y = 35
    
    // 헤더 다시 그리기
    ctx.font = `bold 18px ${mapleFont}`
    ctx.fillStyle = '#1e40af'
    const newTitleWidth = ctx.measureText(title).width
    ctx.fillText(title, (width - newTitleWidth) / 2, y)
    y += 35
    
    // 내용 다시 그리기 (완전한 버전)
    ctx.font = `14px ${defaultFont}`
    ctx.fillStyle = '#374151'
    
    if (type === 'basic') {
      const basicData = data as BasicCalculatorExportData
      const huntTimeStr = getHuntTimeStr(basicData.huntTime, basicData.huntTimeUnit, basicData.isCustomResultTime, basicData.resultTime, basicData.resultTimeUnit)
      const monsterPerTimeStr = getMonsterPerTimeStr(basicData.huntTime, basicData.huntTimeUnit, basicData.monsterCount)
      
      // 핵심 요약 정보 (기본 폰트)
      ctx.font = `bold 14px ${defaultFont}`
      ctx.fillStyle = '#1f2937'
      const dropRateText = basicData.dropRatePotentialLines > 0 ? `아드 ${Math.round(basicData.dropRate)}% (잠재 ${basicData.dropRatePotentialLines}줄)` : `아드 ${Math.round(basicData.dropRate)}%`
      const mesoRateText = basicData.mesoPotentialLines > 0 ? `메획 ${Math.round(basicData.mesoBonus)}% (잠재 ${basicData.mesoPotentialLines}줄)` : `메획 ${Math.round(basicData.mesoBonus)}%`
      ctx.fillText(`${dropRateText}, ${mesoRateText}인 ${basicData.characterLevel}레벨 캐릭터가`, 20, y)
      y += lineHeight + 3
      ctx.fillText(`${basicData.monsterLevel}레벨 몬스터를 ${monsterPerTimeStr}씩 ${huntTimeStr} 사냥하면?`, 20, y)
      y += sectionGap + 10
      
      // 총 수익 (메이플 폰트 - 중요한 결과)
      ctx.font = `bold 18px ${mapleFont}`
      ctx.fillStyle = '#059669'
      ctx.fillText(`💰 총 ${formatMesoWithKorean(basicData.totalIncome)} 메소`, 20, y)
      y += sectionGap + 10
      
      // 상세 내역 제목 (메이플 폰트)
      ctx.font = `bold 14px ${mapleFont}`
      ctx.fillStyle = '#374151'
      ctx.fillText('📦 세부 내역:', 20, y)
      y += lineHeight + 5
      
      // 상세 내역 본문 (기본 폰트)
      ctx.font = `12px ${defaultFont}`
      ctx.fillText(`• 드롭 메소: ${formatMesoWithKorean(basicData.baseMeso)} 메소`, 30, y)
      y += lineHeight
      
      // 솔 에르다 조각 찾기
      const solErdaItem = basicData.topDropItems.find(item => item.name.includes('솔 에르다 조각'))
      if (solErdaItem) {
        ctx.fillText(`• 솔 에르다 조각: ${formatDecimal(solErdaItem.expectedCount)}개 (${formatMesoWithKorean(solErdaItem.expectedValue)} 메소)`, 30, y)
        y += lineHeight
      }
      
      // 기타 드롭 (수익순 정렬, 상위 3개 표시)
      const allOtherItems = basicData.topDropItems.filter(item => !item.name.includes('솔 에르다 조각'))
      if (allOtherItems.length > 0) {
        // 전체 기타 드롭의 총합 계산
        const otherTotal = allOtherItems.reduce((sum, item) => sum + item.expectedValue, 0)
        
        // 표시할 상위 3개 아이템
        const topOtherItems = allOtherItems
          .sort((a, b) => b.expectedValue - a.expectedValue) // 수익순 내림차순 정렬
          .slice(0, 3)
        
        // 기타 드롭 제목과 상위 3개 표시 문구를 한 줄에
        ctx.fillText(`• 기타 드롭: ${formatMesoWithKorean(otherTotal)} 메소`, 30, y)
        
        if (allOtherItems.length > 3) {
          ctx.font = `9px ${defaultFont}`
          ctx.fillStyle = '#9ca3af'
          ctx.fillText(`(상위 ${Math.min(3, topOtherItems.length)}개만 표시)`, 250, y)
          ctx.font = `12px ${defaultFont}`
          ctx.fillStyle = '#374151'
        }
        
        y += lineHeight
        
        topOtherItems.forEach((item, index) => {
          ctx.fillText(`  ${index + 1}. ${item.name}: ${formatDecimal(item.expectedCount)}개`, 40, y)
          y += lineHeight
        })
      }
      
      if (basicData.wealthAcquisitionPotion && basicData.wealthAcquisitionPotionCost) {
        ctx.fillText(`• 재획비 비용: -${formatMesoWithKorean(basicData.wealthAcquisitionPotionCost)} 메소`, 30, y)
        y += lineHeight
      }
    } else {
      const breakevenData = data as BreakevenCalculatorExportData
      
      // 핵심 요약 정보 (기본 폰트)
      ctx.font = `bold 14px ${defaultFont}`
      ctx.fillStyle = '#1f2937'
      const dropRateText = breakevenData.baseCalculation.dropRatePotentialLines > 0 
        ? `아드 ${Math.round(breakevenData.baseCalculation.dropRate)}% (잠재 ${breakevenData.baseCalculation.dropRatePotentialLines}줄)` 
        : `아드 ${Math.round(breakevenData.baseCalculation.dropRate)}%`
      const mesoRateText = breakevenData.baseCalculation.mesoPotentialLines > 0 
        ? `메획 ${Math.round(breakevenData.baseCalculation.mesoBonus)}% (잠재 ${breakevenData.baseCalculation.mesoPotentialLines}줄)` 
        : `메획 ${Math.round(breakevenData.baseCalculation.mesoBonus)}%`
      ctx.fillText(`${dropRateText}, ${mesoRateText}인 ${breakevenData.baseCalculation.characterLevel}레벨 캐릭터`, 20, y)
      y += lineHeight + 3
      
      // 기준 설정 (소재 vs 메소제한)
      if (breakevenData.mesoLimitEnabled && breakevenData.mesoLimitHours !== undefined) {
        const hours = breakevenData.mesoLimitHours
        const minutes = breakevenData.mesoLimitMinutes || 0
        if (minutes > 0) {
          ctx.fillText(`매일 메소제한(${hours}시간 ${minutes}분), 수수료 ${breakevenData.globalFeeRate}% 기준`, 20, y)
        } else {
          ctx.fillText(`매일 메소제한(${hours}시간), 수수료 ${breakevenData.globalFeeRate}% 기준`, 20, y)
        }
      } else {
        ctx.fillText(`매일 ${breakevenData.materialsPerDay}소재, 수수료 ${breakevenData.globalFeeRate}% 기준`, 20, y)
      }
      y += lineHeight + 5
      
      // 전체 아이템 구매 시 총 결과 (메이플 폰트 - 중요한 정보)
      ctx.font = `bold 14px ${mapleFont}`
      ctx.fillStyle = '#1e40af'
      ctx.fillText('💎 전체 아이템 구매 시:', 20, y)
      y += lineHeight + 5
      
      ctx.font = `12px ${defaultFont}`
      ctx.fillStyle = '#374151'
      ctx.fillText(`• 총 잠재: 아드 ${breakevenData.totalResult.totalDropLines}줄, 메획 ${breakevenData.totalResult.totalMesoLines}줄`, 30, y)
      y += lineHeight
      ctx.fillText(`• 총 순 투자 비용: ${formatMesoWithKorean(breakevenData.totalResult.netCost * 100000000)} 메소`, 30, y)
      y += lineHeight
      ctx.fillStyle = '#059669'
      ctx.fillText(`• 시간당 총 증가 수익: ${formatMesoWithKorean(breakevenData.totalResult.increasePerHour)} 메소`, 30, y)
      y += lineHeight
      ctx.fillStyle = '#dc2626'
      ctx.fillText(`• 손익분기: ${breakevenData.totalResult.formattedPeriod}`, 30, y)
      y += sectionGap + 10
      
      // 아이템별 손익분기 제목 (메이플 폰트)
      ctx.font = `bold 14px ${mapleFont}`
      ctx.fillStyle = '#374151'
      ctx.fillText('💎 아이템별 손익분기:', 20, y)
      y += lineHeight + 10
      
      // 아이템 목록 (기본 폰트)
      ctx.font = `12px ${defaultFont}`
      breakevenData.items.forEach((item, index) => {
        // 아이템명과 손익분기 (메이플 폰트 - 중요한 정보)
        ctx.font = `bold 12px ${mapleFont}`
        ctx.fillText(`• ${item.name}: ${item.formattedPeriod}`, 30, y)
        y += lineHeight
        // 세부 정보 (기본 폰트)
        ctx.font = `11px ${defaultFont}`
        ctx.fillStyle = '#6b7280'
        // 잠재 줄 수를 간단하게 표시: "드"*드롭줄수 + "메"*메획줄수
        const potentialText = "드".repeat(item.dropLines) + "메".repeat(item.mesoLines)
        ctx.fillText(`  ${potentialText} | ${item.purchasePrice.toFixed(1)}억 구매, ${item.sellPrice.toFixed(1)}억 판매로 ${item.netCost.toFixed(1)}억 지불`, 30, y)
        y += lineHeight
        ctx.fillText(`  시간당 증가 수익: ${formatMesoWithKorean(item.increasePerHour)} 메소`, 30, y)
        y += lineHeight + 5
        ctx.fillStyle = '#374151'
      })
    }
    
    // 하단 크레딧 (기본 폰트, 오른쪽 정렬, 한 줄에 표시)
    ctx.font = `12px ${defaultFont}`
    ctx.fillStyle = '#9ca3af'
    ctx.textAlign = 'right'
    ctx.fillText('메이플스토리 계산기 유틸리티 - https://gyeryak.github.io/calculator-utility/', width - 20, actualHeight - 40)
    
    // 메이플스토리 폰트 라이선스 표기 (기본 폰트)
    ctx.font = `10px ${defaultFont}`
    ctx.fillStyle = '#a0a0a0'
    ctx.fillText('이 이미지에는 메이플스토리가 제공한 메이플스토리 서체가 적용되어 있습니다.', width - 20, actualHeight - 20)
    ctx.textAlign = 'left' // 기본값으로 복원
    
    // Blob으로 변환
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png')
  })
}


/**
 * 기본 계산기 텍스트 형태로 내보내기
 */
export function exportBasicCalculatorAsText(data: BasicCalculatorExportData): string {
  const huntTimeStr = getHuntTimeStr(data.huntTime, data.huntTimeUnit, data.isCustomResultTime, data.resultTime, data.resultTimeUnit)
  const monsterPerTimeStr = getMonsterPerTimeStr(data.huntTime, data.huntTimeUnit, data.monsterCount)

  let text = `📊 메이플 사냥 기댓값 계산 결과\n`
  
  // 핵심 정보 한 줄 요약
  const dropRateText = data.dropRatePotentialLines > 0 ? `아드 ${Math.round(data.dropRate)}% (잠재 ${data.dropRatePotentialLines}줄)` : `아드 ${Math.round(data.dropRate)}%`
  const mesoRateText = data.mesoPotentialLines > 0 ? `메획 ${Math.round(data.mesoBonus)}% (잠재 ${data.mesoPotentialLines}줄)` : `메획 ${Math.round(data.mesoBonus)}%`
  text += `${dropRateText}, ${mesoRateText}인 ${data.characterLevel}렙 캐릭터가\n`
  text += `${data.monsterLevel}렙 몬스터를 ${monsterPerTimeStr}씩 ${huntTimeStr} 사냥하면?\n\n`
  
  // 총 수익
  text += `💰 총 ${formatMesoWithKorean(data.totalIncome)} 메소\n\n`
  
  // 상세 내역
  text += `📦 세부 내역:\n`
  text += `• 드롭 메소: ${formatMesoWithKorean(data.baseMeso)} 메소\n`
  
  // 솔 에르다 조각 찾기
  const solErdaItem = data.topDropItems.find(item => item.name.includes('솔 에르다 조각'))
  if (solErdaItem) {
    text += `• 솔 에르다 조각: ${formatDecimal(solErdaItem.expectedCount)}개 (${formatMesoWithKorean(solErdaItem.expectedValue)} 메소)\n`
  }
  
  // 기타 드롭 (수익순 정렬, 상위 3개 표시)
  const allOtherItems = data.topDropItems.filter(item => !item.name.includes('솔 에르다 조각'))
  if (allOtherItems.length > 0) {
    // 전체 기타 드롭의 총합 계산
    const otherTotal = allOtherItems.reduce((sum, item) => sum + item.expectedValue, 0)
    
    // 표시할 상위 3개 아이템
    const topOtherItems = allOtherItems
      .sort((a, b) => b.expectedValue - a.expectedValue) // 수익순 내림차순 정렬
      .slice(0, 3)
    
    text += `• 기타 드롭: ${formatMesoWithKorean(otherTotal)} 메소\n`
    
    if (allOtherItems.length > 3) {
      text += `  (상위 3개 표시)\n`
    }
    
    topOtherItems.forEach((item, index) => {
      text += `  ${index + 1}. ${item.name}: ${formatDecimal(item.expectedCount)}개\n`
    })
  }
  
  if (data.wealthAcquisitionPotion && data.wealthAcquisitionPotionCost) {
    text += `• 재획비 비용: -${formatMesoWithKorean(data.wealthAcquisitionPotionCost)} 메소\n`
  }
  
  text += `\n🔗 https://gyeryak.github.io/calculator-utility/ 에서 계산됨`
  
  return text
}

/**
 * 손익분기 계산기 텍스트 형태로 내보내기
 */
export function exportBreakevenCalculatorAsText(data: BreakevenCalculatorExportData): string {
  let text = `📊 드메템 손익분기 계산 결과\n`
  text += `${data.calculatedAt}\n\n`
  
  // 기본 정보 (이미지와 동일한 형식으로 잠재 줄 수 포함)
  const dropRateText = data.baseCalculation.dropRatePotentialLines > 0 
    ? `아드 ${Math.round(data.baseCalculation.dropRate)}% (잠재 ${data.baseCalculation.dropRatePotentialLines}줄)` 
    : `아드 ${Math.round(data.baseCalculation.dropRate)}%`
  const mesoRateText = data.baseCalculation.mesoPotentialLines > 0 
    ? `메획 ${Math.round(data.baseCalculation.mesoBonus)}% (잠재 ${data.baseCalculation.mesoPotentialLines}줄)` 
    : `메획 ${Math.round(data.baseCalculation.mesoBonus)}%`
  text += `🎯 ${dropRateText}, ${mesoRateText}인 ${data.baseCalculation.characterLevel}레벨 캐릭터\n`
  
  // 기준 설정 (소재 vs 메소제한)
  if (data.mesoLimitEnabled && data.mesoLimitHours !== undefined) {
    const hours = data.mesoLimitHours
    const minutes = data.mesoLimitMinutes || 0
    if (minutes > 0) {
      text += `매일 메소제한(${hours}시간 ${minutes}분), 수수료 ${data.globalFeeRate}% 기준\n`
    } else {
      text += `매일 메소제한(${hours}시간), 수수료 ${data.globalFeeRate}% 기준\n`
    }
  } else {
    text += `매일 ${data.materialsPerDay}소재, 수수료 ${data.globalFeeRate}% 기준\n`
  }
  
  // 전체 아이템 구매 시 총 결과
  text += `💎 전체 아이템 구매 시:\n`
  text += `• 총 잠재: 아드 ${data.totalResult.totalDropLines}줄, 메획 ${data.totalResult.totalMesoLines}줄\n`
  text += `• 총 순 투자 비용: ${formatMesoWithKorean(data.totalResult.netCost * 100000000)} 메소\n`
  text += `• 시간당 총 증가 수익: ${formatMesoWithKorean(data.totalResult.increasePerHour)} 메소\n`
  text += `• 손익분기: ${data.totalResult.formattedPeriod}\n\n`
  
  // 아이템별 손익분기
  text += `💎 아이템별 손익분기:\n`
  data.items.forEach((item, index) => {
    // 잠재 줄 수를 간단하게 표시: "드"*드롭줄수 + "메"*메획줄수
    const potentialText = "드".repeat(item.dropLines) + "메".repeat(item.mesoLines)
    text += `• ${item.name}: ${item.formattedPeriod}\n`
    text += `  ${potentialText} | ${item.purchasePrice.toFixed(1)}억 구매, ${item.sellPrice.toFixed(1)}억 판매로 ${item.netCost.toFixed(1)}억 지불\n`
    text += `  시간당 증가 수익: ${formatMesoWithKorean(item.increasePerHour)} 메소\n`
    if (index < data.items.length - 1) text += '\n'
  })
  
  text += `\n🔗 https://gyeryak.github.io/calculator-utility/`
  
  return text
}

/**
 * 파일 다운로드
 */
export function downloadFile(content: string | Blob, filename: string, mimeType?: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType || 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}