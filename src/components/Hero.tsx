export function Hero() {
  return (
    <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
        계산 유틸리티
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 mb-6 max-w-3xl mx-auto">
        다양한 상황에서 필요한 계산을 손쉽게 할 수 있는 웹 기반 도구
      </p>
      <div className="bg-white/60 rounded-lg p-4 max-w-2xl mx-auto mb-4">
        <p className="text-lg text-blue-700 font-medium mb-2">
          ✅ 현재 이용 가능: 드랍/메소 획득 손익분기 계산기
        </p>
        <p className="text-sm text-gray-600">
          🚧 추가 계산기들 개발 예정
        </p>
      </div>
      <p className="text-lg text-gray-500 max-w-2xl mx-auto">
        모든 계산은 브라우저에서 처리되어 개인정보가 안전하게 보호됩니다
      </p>
    </div>
  )
} 