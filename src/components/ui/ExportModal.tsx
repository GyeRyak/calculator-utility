'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Copy, Download, Check } from 'lucide-react'
import {
  generateImageFromData,
  exportBasicCalculatorAsText,
  exportBreakevenCalculatorAsText,
  exportLoungeCalculatorAsText,
  downloadFile,
  type BasicCalculatorExportData,
  type BreakevenCalculatorExportData,
  type LoungeCalculatorExportData
} from '@/utils/exportUtils'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  data: BasicCalculatorExportData | BreakevenCalculatorExportData | LoungeCalculatorExportData
  type: 'basic' | 'breakeven' | 'lounge'
}

export default function ExportModal({ isOpen, onClose, data, type }: ExportModalProps) {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [textContent, setTextContent] = useState<string>('')
  const [copiedText, setCopiedText] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 데이터가 변경될 때마다 이미지와 텍스트 생성
  useEffect(() => {
    if (!isOpen) {
      // 모달이 닫힐 때 상태 초기화
      setImageLoading(true)
      setImageBlob(null)
      setCopiedText(false)
      setCopiedImage(false)
      return
    }

    const generateContent = async () => {
      // 텍스트 생성
      let text: string
      if (type === 'basic') {
        text = exportBasicCalculatorAsText(data as BasicCalculatorExportData)
      } else if (type === 'breakeven') {
        text = exportBreakevenCalculatorAsText(data as BreakevenCalculatorExportData)
      } else {
        text = exportLoungeCalculatorAsText(data as LoungeCalculatorExportData)
      }
      setTextContent(text)

      // 이미지 생성
      setImageLoading(true)
      try {
        const blob = await generateImageFromData(data, type)
        setImageBlob(blob)
        
        // 캔버스에 이미지 표시
        if (blob) {
          // setTimeout을 사용하여 DOM이 렌더링된 후 캔버스에 그리기
          setTimeout(() => {
            if (canvasRef.current) {
              const canvas = canvasRef.current
              const ctx = canvas.getContext('2d')!
              const img = new Image()
              
              img.onload = () => {
                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)
                setImageLoading(false)
              }
              
              img.onerror = () => {
                console.error('이미지 로드 실패')
                setImageLoading(false)
              }
              
              img.src = URL.createObjectURL(blob)
            } else {
              setImageLoading(false)
            }
          }, 100)
        } else {
          setImageLoading(false)
        }
      } catch (error) {
        console.error('이미지 생성 실패:', error)
        setImageLoading(false)
      }
    }

    generateContent()
  }, [isOpen, data, type])

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(textContent)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
      alert('클립보드 복사에 실패했습니다.')
    }
  }

  const handleCopyImage = async () => {
    if (!imageBlob) return
    
    try {
      // ClipboardItem API를 사용하여 이미지 복사
      const item = new ClipboardItem({ 'image/png': imageBlob })
      await navigator.clipboard.write([item])
      setCopiedImage(true)
      setTimeout(() => setCopiedImage(false), 2000)
    } catch (error) {
      console.error('이미지 클립보드 복사 실패:', error)
      // ClipboardItem API를 지원하지 않는 경우 대체 메시지
      alert('이미지 복사는 이 브라우저에서 지원되지 않습니다. 이미지를 저장한 후 사용해주세요.')
    }
  }

  const handleDownloadImage = () => {
    if (!imageBlob) return

    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const calculatorName = type === 'basic' ? '사냥기댓값' : type === 'breakeven' ? '손익분기' : '휴게실최적화'
    const filename = `${calculatorName}_계산결과_${timestamp}.png`

    downloadFile(imageBlob, filename)
  }

  const handleDownloadText = () => {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const calculatorName = type === 'basic' ? '사냥기댓값' : type === 'breakeven' ? '손익분기' : '휴게실최적화'
    const filename = `${calculatorName}_계산결과_${timestamp}.txt`

    downloadFile(textContent, filename, 'text/plain;charset=utf-8')
  }

  if (!isOpen) return null

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* 모달 내용 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                결과 공유하기
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {type === 'basic' ? '사냥 기댓값 계산기' : type === 'breakeven' ? '손익분기 계산기' : '아지트 듀오 휴게실 계산기'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* 본문 */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 텍스트 미리보기 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">📝 텍스트 형태</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyText}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      {copiedText ? <Check size={14} /> : <Copy size={14} />}
                      {copiedText ? '복사됨' : '복사'}
                    </button>
                    <button
                      onClick={handleDownloadText}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <Download size={14} />
                      파일저장
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {textContent}
                  </pre>
                </div>
                
              </div>
              
              {/* 이미지 미리보기 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">🖼️ 이미지 형태</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyImage}
                      disabled={!imageBlob || imageLoading}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-1"
                    >
                      {copiedImage ? <Check size={14} /> : <Copy size={14} />}
                      {copiedImage ? '복사됨' : '복사'}
                    </button>
                    <button
                      onClick={handleDownloadImage}
                      disabled={!imageBlob || imageLoading}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-1"
                    >
                      <Download size={14} />
                      저장
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border flex items-center justify-center min-h-[300px]">
                  {imageLoading && !imageBlob ? (
                    <div className="text-gray-500 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-3"></div>
                      <p className="text-sm font-medium">이미지 생성 중...</p>
                      <p className="text-xs mt-1">잠시만 기다려주세요</p>
                    </div>
                  ) : (
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto border rounded shadow-sm"
                      style={{ maxHeight: '400px', display: imageBlob ? 'block' : 'none' }}
                    />
                  )}
                  {!imageLoading && !imageBlob && (
                    <div className="text-gray-500 text-center">
                      <p className="text-sm">이미지 생성 실패</p>
                      <p className="text-xs mt-1">다시 시도해주세요</p>
                    </div>
                  )}
                </div>
                
              </div>
              
            </div>
          </div>
          
          {/* 하단 버튼 */}
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  )
}