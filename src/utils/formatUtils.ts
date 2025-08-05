export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ko-KR').format(Math.floor(num))
}

export const formatMesoWithKorean = (num: number, onlyKorean: boolean = false) => {
  const isNegative = num < 0
  const absNum = Math.abs(Math.floor(num))
  const formatted = new Intl.NumberFormat('ko-KR').format(Math.floor(num))
  
  // 0인 경우 처리
  if (absNum === 0) {
    return '0'
  }
  
  // 한글 단위 계산
  let koreanUnit = ''
  if (absNum >= 1000000000000) { // 조 단위
    const jo = Math.floor(absNum / 1000000000000)
    const remainingAfterJo = absNum % 1000000000000
    const eok = Math.floor(remainingAfterJo / 100000000)
    const man = Math.floor((remainingAfterJo % 100000000) / 10000)
    
    koreanUnit = `${jo}조`
    if (eok > 0) koreanUnit += ` ${eok}억`
    if (man > 0) koreanUnit += ` ${man}만`
  } else if (absNum >= 100000000) { // 억 단위
    const eok = Math.floor(absNum / 100000000)
    const man = Math.floor((absNum % 100000000) / 10000)
    
    koreanUnit = `${eok}억`
    if (man > 0) koreanUnit += ` ${man}만`
  } else if (absNum >= 10000) { // 만 단위
    const man = Math.floor(absNum / 10000)
    koreanUnit = `${man}만`
  }
  
  // 음수 처리
  if (isNegative) {
    koreanUnit = `-${koreanUnit}`
  }
  
  return onlyKorean ? koreanUnit : (koreanUnit ? `${formatted} (${koreanUnit})` : formatted)
}

export const formatDecimal = (num: number, decimals: number = 2) => {
  return new Intl.NumberFormat('ko-KR', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  }).format(num)
}