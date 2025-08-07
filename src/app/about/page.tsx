export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">소개</h1>
      <div className="max-w-4xl mx-auto prose prose-lg">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-4">계산 유틸리티에 대하여</h2>
          <p className="text-gray-700 mb-6">
            이 웹사이트는 게임 및 일상생활에서 필요한 다양한 계산을 쉽고 빠르게 할 수 있도록 도와주는 유틸리티 모음입니다.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">현재 제공하는 계산기</h3>
          <ul className="list-disc list-inside text-gray-700 mb-6">
            <li><strong>사냥 기댓값 계산기</strong>: 아이템 드롭률과 메소 획득량을 고려한 사냥 기댓값 계산</li>
            <li><strong>손익분기 계산기</strong>: 재획득의 비약 적용 전후 수익성 비교</li>
          </ul>
          
          <h3 className="text-xl font-semibold mb-3">데이터 출처 및 크레딧</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 mb-3">
              본 계산기에 사용된 특정 계산식 및 추정치는 다음 자료를 참고하였습니다:
            </p>
            <div className="text-sm text-gray-600 space-y-2">
              <div>
                <p className="font-medium">• 메소 제한 관련 정보</p>
                <p className="ml-4 text-xs">2025년 8월 중 인게임 내 툴팁을 통해 확인</p>
              </div>
              
              <div>
                <p className="font-medium">• 레벨 차이에 의한 메소 획득 패널티</p>
                <p className="ml-4 text-xs">
                  <a href="https://namu.wiki/w/%EB%A9%94%EC%9D%B4%ED%94%8C%EC%8A%A4%ED%86%A0%EB%A6%AC/%EC%9E%AC%ED%99%94?uuid=a18e6599-1e1d-4b96-a6d0-67ea129e00d0" 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 underline">
                    나무위키 - 메이플스토리/재화
                  </a>
                </p>
              </div>
              
              <div>
                <p className="font-medium">• 길드 스킬 정보</p>
                <p className="ml-4 text-xs">
                  <a href="https://namu.wiki/w/%EA%B8%B8%EB%93%9C%20%EC%8A%A4%ED%82%AC?uuid=5d61764a-9bc0-4f07-93d0-41b7e699725a" 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 underline">
                    나무위키 - 길드 스킬
                  </a>
                </p>
              </div>
              
              <div>
                <p className="font-medium">• 유니온 아티팩트 정보</p>
                <p className="ml-4 text-xs">
                  <a href="https://namu.wiki/w/%EC%9C%A0%EB%8B%88%EC%98%A8%20%EC%95%84%ED%8B%B0%ED%8C%A9%ED%8A%B8?uuid=bc66a6b9-41bb-4a45-8e90-238c1ed72f1d" 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 underline">
                    나무위키 - 유니온 아티팩트
                  </a>
                </p>
              </div>
              
              <div>
                <p className="font-medium">• 아이템 드롭률 로그 적용식</p>
                <p className="ml-4 text-xs">
                  솔 에르다 조각의 아이템 드롭률을 자연로그식으로 추정한
                  <a href="https://www.inven.co.kr/board/maple/2304/37701" 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 underline ml-1">
                    인벤 연구 글
                  </a>을 바탕으로 로그식 일괄 적용
                </p>
              </div>
              
              <div>
                <p className="font-medium">• 젬스톤 및 심볼 아이템 드롭률 (로그식 적용 가정)</p>
                <p className="ml-4 text-xs">
                  <a href="https://www.inven.co.kr/board/maple/2304/19614" 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 underline">
                    아이템 드롭률 359% 통계 자료
                  </a>를 바탕으로 역산
                </p>
              </div>
              
              <div>
                <p className="font-medium">• 순록의 우유, 황혼의 이슬, 주문의 흔적 (일반식 적용 가정)</p>
                <p className="ml-4 text-xs">
                  <a href="https://www.inven.co.kr/board/maple/2304/19614" 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 underline">
                    아이템 드롭률 359% 통계 자료
                  </a>를 바탕으로 역산
                </p>
              </div>
              
              <div>
                <p className="font-medium">• 메소 드롭 값 및 기타 게임 공식</p>
                <p className="ml-4 text-xs">
                  <a href="https://strategywiki.org/w/index.php?title=MapleStory/Formulas&oldid=1104343#Meso_Drop" 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 underline">
                    StrategyWiki - MapleStory Formulas
                  </a>
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>주의사항:</strong> 아이템 드롭률 값들은 엘리트 몬스터 등으로 인해 실제 아이템 드롭률과 차이가 있을 수 있으나, 
                장기적인 사냥 시 해당 값과 유사한 흐름을 보일 것으로 예상되어 단순 역산 처리하였습니다.
              </p>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-3">기술 스택</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-800 mb-2">프론트엔드</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Next.js 14 (App Router)</li>
                  <li>TypeScript</li>
                  <li>Tailwind CSS</li>
                  <li>Lucide React Icons</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-2">배포 및 인프라</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>GitHub Pages (정적 호스팅)</li>
                  <li>클라이언트 사이드 렌더링</li>
                  <li>모든 계산 로컬 처리</li>
                  <li>쿠키 기반 설정 저장</li>
                </ul>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3">라이선스</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 mb-3">
              본 프로젝트는 커스텀 라이선스를 사용합니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
              <li><strong>코드 자체 판매 금지:</strong> 코드를 그 자체로 판매하는 것은 불가능합니다</li>
              <li><strong>코드 활용 시:</strong> 일부만 활용 시 이외 조건 없음, 대량 활용 시 출처 표기 필수</li>
              <li><strong>무보증:</strong> 소프트웨어 사용에 대한 어떠한 보증도 제공하지 않습니다</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              자세한 내용은 
              <a href="https://github.com/gyeryak/calculator-utility/blob/main/LICENSE.md" 
                 target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 hover:text-blue-800 underline ml-1">
                LICENSE.md
              </a>
              를 참조하세요.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">면책 조항</h3>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-800 text-sm">
              ⚠️ <strong>중요:</strong> 본 계산기는 특정 게임 또는 게임사의 공식 컨텐츠가 아닙니다. 
              실제 게임 내 적용되는 공식과 계산 결과는 다를 수 있으며, 
              본 계산기의 결과는 참고용으로만 사용하시기 바랍니다.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">개발 예정 및 기여</h3>
          <p className="text-gray-700 mb-4">
            더 많은 유용한 계산기들을 추가할 예정입니다.
          </p>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-green-800 text-sm mb-2">
              💡 <strong>건의사항 및 개선 요청</strong>
            </p>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• 버그 리포트, 기능 제안: 
                <a href="https://github.com/gyeryak/calculator-utility/issues" 
                   target="_blank" rel="noopener noreferrer"
                   className="text-blue-600 hover:text-blue-800 underline">
                  GitHub Issues
                </a>
              </li>
              <li>• 코드 기여: 
                <a href="https://github.com/gyeryak/calculator-utility/pulls" 
                   target="_blank" rel="noopener noreferrer"
                   className="text-blue-600 hover:text-blue-800 underline">
                  Pull Request
                </a>
              </li>
              <li>• 여러분의 피드백과 기여를 환영합니다!</li>
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  )
}