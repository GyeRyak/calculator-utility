// 메소 배율 디버깅 스크립트
function calculateMesoDropByLevel(monsterLevel) {
  let minMultiplier, maxMultiplier;
  
  if (monsterLevel === 1) {
    minMultiplier = 1;
    maxMultiplier = 1;
  } else if (monsterLevel >= 2 && monsterLevel <= 20) {
    minMultiplier = 1.6;
    maxMultiplier = 2.4;
  } else if (monsterLevel >= 21 && monsterLevel <= 30) {
    minMultiplier = 2.0;
    maxMultiplier = 3.0;
  } else if (monsterLevel >= 31 && monsterLevel <= 40) {
    minMultiplier = 2.4;
    maxMultiplier = 3.6;
  } else if (monsterLevel >= 41 && monsterLevel <= 50) {
    minMultiplier = 2.8;
    maxMultiplier = 4.2;
  } else if (monsterLevel >= 51 && monsterLevel <= 60) {
    minMultiplier = 4.0;
    maxMultiplier = 6.0;
  } else if (monsterLevel >= 61 && monsterLevel <= 70) {
    minMultiplier = 4.8;
    maxMultiplier = 7.2;
  } else if (monsterLevel >= 71 && monsterLevel <= 80) {
    minMultiplier = 5.2;
    maxMultiplier = 7.8;
  } else if (monsterLevel >= 81 && monsterLevel <= 90) {
    minMultiplier = 5.6;
    maxMultiplier = 8.4;
  } else { // 91+
    minMultiplier = 6.0;
    maxMultiplier = 9.0;
  }
  
  const minimum = Math.floor(minMultiplier * monsterLevel);
  const maximum = Math.floor(maxMultiplier * monsterLevel);
  const average = Math.floor((minimum + maximum) / 2);
  const currentAverageMultiplier = average / monsterLevel;
  
  return {
    minimum,
    maximum,
    average,
    currentAverageMultiplier
  };
}

// 91레벨 몬스터 테스트
const monsterLevel = 91;
const result = calculateMesoDropByLevel(monsterLevel);
const maxAverageMultiplier = 7.5;

console.log(`몬스터 레벨: ${monsterLevel}`);
console.log(`최소: ${result.minimum}`);
console.log(`최대: ${result.maximum}`);
console.log(`평균: ${result.average}`);
console.log(`현재 배율: ${result.currentAverageMultiplier}`);
console.log(`최대 배율: ${maxAverageMultiplier}`);
console.log(`차이: ${Math.abs(result.currentAverageMultiplier - maxAverageMultiplier)}`);
console.log(`최적 레벨인가: ${Math.abs(result.currentAverageMultiplier - maxAverageMultiplier) < 0.001}`);