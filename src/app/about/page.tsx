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
            <li><strong>드랍/메소 획득 손익분기 계산기</strong>: 아이템 드랍률과 메소 획득량을 고려한 손익분기점 계산</li>
          </ul>
          
          <h3 className="text-xl font-semibold mb-3">개발 예정</h3>
          <p className="text-gray-700 mb-4">
            더 많은 유용한 계산기들을 추가할 예정입니다. 계산기 추가 요청이나 개선 사항이 있으시면 언제든지 알려주세요.
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
            <p className="text-blue-800">
              💡 <strong>팁:</strong> 모든 계산은 클라이언트 사이드에서 처리되므로 개인정보가 서버로 전송되지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}