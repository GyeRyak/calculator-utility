'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, User, Download } from 'lucide-react'
import type { CharacterConfig } from '@/utils/defaults/bossChaseDefaults'
import { CHARACTER_PRESETS, getPresetById } from '@/data/presets'
import { getBossById, getBossDifficulty } from '@/data/bossData'
import { formatBossListInline, formatBossListMultiline } from '@/utils/bossDisplayOrder'
import CharacterEditor from './CharacterEditor'

interface CharacterManagementProps {
  characters: CharacterConfig[]
  onCharactersChange: (characters: CharacterConfig[]) => void
  globalDropRateBonus?: number  // 전역 드롭률 표시를 위해 추가
}

export default function CharacterManagement({
  characters,
  onCharactersChange,
  globalDropRateBonus = 0
}: CharacterManagementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<CharacterConfig | null>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)

  // 새 캐릭터 추가
  const handleAddCharacter = () => {
    setEditingCharacter({
      id: `char_${Date.now()}`,
      name: '',
      bossList: [],
      useGlobalDropRate: true, // 기본값: 전역 설정 사용
      customDropRate: 0 // 기본값: 0
    })
    setEditingIndex(-1)
    setIsEditing(true)
  }

  // 캐릭터 편집
  const handleEditCharacter = (index: number) => {
    setEditingCharacter({ ...characters[index] })
    setEditingIndex(index)
    setIsEditing(true)
  }

  // 캐릭터 삭제
  const handleDeleteCharacter = (index: number) => {
    if (confirm('캐릭터를 삭제하시겠습니까?')) {
      const newCharacters = characters.filter((_, i) => i !== index)
      onCharactersChange(newCharacters)
    }
  }

  // 캐릭터 저장
  const handleSaveCharacter = (character: CharacterConfig) => {
    if (editingIndex === -1) {
      // 새 캐릭터 추가
      onCharactersChange([...characters, character])
    } else {
      // 기존 캐릭터 수정
      const newCharacters = [...characters]
      newCharacters[editingIndex] = character
      onCharactersChange(newCharacters)
    }
    setIsEditing(false)
    setEditingCharacter(null)
    setEditingIndex(-1)
  }

  // 중복되지 않는 캐릭터 이름 생성
  const generateUniqueCharacterName = (baseName: string, existingNames: string[]): string => {
    if (!existingNames.includes(baseName)) {
      return baseName
    }
    
    let counter = 2
    let newName = `${baseName} ${counter}`
    
    while (existingNames.includes(newName)) {
      counter++
      newName = `${baseName} ${counter}`
    }
    
    return newName
  }

  // 프리셋 불러오기
  const handleLoadPreset = (presetId: string) => {
    const preset = getPresetById(presetId)
    if (!preset) return

    // 현재 존재하는 모든 캐릭터 이름 목록
    const existingNames = characters.map(char => char.name)

    const presetCharacters: CharacterConfig[] = preset.characters.map((char, index) => {
      // 프리셋 이름을 기본 이름으로 사용하고, 중복 시 번호 추가
      const uniqueName = generateUniqueCharacterName(preset.name, existingNames)
      existingNames.push(uniqueName) // 다음 캐릭터 처리를 위해 추가
      
      return {
        id: `preset_${presetId}_${index}_${Date.now()}`,
        name: uniqueName,
        bossList: char.bossList.map(boss => ({
          bossId: boss.bossId,
          difficulty: boss.difficulty,
          partySize: boss.partySize
        })),
        useGlobalDropRate: true, // 기본값: 전역 설정 사용
        customDropRate: 0 // 기본값: 0
      }
    })

    if (confirm(`${preset.name} 프리셋을 추가하시겠습니까?`)) {
      // 기존 캐릭터 목록에 프리셋 캐릭터들을 추가
      onCharactersChange([...characters, ...presetCharacters])
    }
  }

  // 보스 이름을 한국어로 표시
  const getBossDisplayName = (bossId: string, difficulty: string) => {
    const boss = getBossById(bossId)
    const difficultyData = getBossDifficulty(bossId, difficulty)
    if (!boss || !difficultyData) return `${bossId} (${difficulty})`
    
    return `${difficultyData.name} ${boss.name}`
  }

  // 파티 사이즈를 포함한 보스 목록 포맷팅
  const formatBossListWithPartySize = (bossList: typeof characters[0]['bossList']) => {
    // 표시 순서로 정렬
    const { sortBossListByDisplayOrder } = require('@/utils/bossDisplayOrder')
    const sortedBosses = sortBossListByDisplayOrder(bossList)
    
    // 보스 이름 가져오기 (파티 사이즈 포함)
    const bossNames = sortedBosses.map((boss: any) => {
      const bossData = getBossById(boss.bossId)
      const difficultyData = getBossDifficulty(boss.bossId, boss.difficulty)
      
      if (!bossData || !difficultyData) {
        return `${boss.bossId}(${boss.difficulty})`
      }
      
      const baseName = `${difficultyData.name} ${bossData.name}`
      // 1인이 아닌 경우에만 인원수 표시
      return boss.partySize > 1 ? `${baseName}(${boss.partySize}인)` : baseName
    })
    
    return bossNames.join(', ')
  }

  // 보스 리스트에서 주간/월간 보스 개수 계산
  const countBossByType = (bossList: typeof characters[0]['bossList']) => {
    let weeklyCount = 0
    let monthlyCount = 0
    
    bossList.forEach(bossEntry => {
      const boss = getBossById(bossEntry.bossId)
      if (boss) {
        if (boss.type === 'weekly') {
          weeklyCount++
        } else if (boss.type === 'monthly') {
          monthlyCount++
        }
      }
    })
    
    return { weeklyCount, monthlyCount }
  }

  // 편집 중일 때는 에디터 표시
  if (isEditing && editingCharacter) {
    return (
      <CharacterEditor
        character={editingCharacter}
        onSave={handleSaveCharacter}
        onCancel={() => {
          setIsEditing(false)
          setEditingCharacter(null)
          setEditingIndex(-1)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">캐릭터 관리</h3>
          <p className="text-sm text-gray-600">
            보스를 클리어하는 캐릭터들을 등록하세요.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* 프리셋 버튼들 */}
          {CHARACTER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset.id)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Download className="w-3 h-3 mr-1" />
              {preset.name}
            </button>
          ))}
          
          {/* 새 캐릭터 추가 버튼 */}
          <button
            onClick={handleAddCharacter}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            캐릭터 추가
          </button>
        </div>
      </div>

      {/* 캐릭터 목록 */}
      {characters.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            등록된 캐릭터가 없습니다
          </h4>
          <p className="text-gray-600 mb-4">
            새 캐릭터를 추가하거나 프리셋을 추가해 보세요.
          </p>
          <button
            onClick={handleAddCharacter}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            첫 번째 캐릭터 추가
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character, index) => (
            <div
              key={character.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {character.name || '이름 없음'}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    {(() => {
                      const { weeklyCount, monthlyCount } = countBossByType(character.bossList)
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            {monthlyCount > 0 && <span>월간 x{monthlyCount}</span>}
                            {weeklyCount > 0 && <span>주간 x{weeklyCount}</span>}
                          </div>
                          <div>
                            아이템 드롭률 {
                              character.useGlobalDropRate !== false 
                                ? `${globalDropRateBonus}%(전역)`
                                : `${character.customDropRate || 0}%`
                            }
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditCharacter(index)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="편집"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCharacter(index)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* 보스 목록 미리보기 (한 줄로 표시, 최대 3줄) */}
              {character.bossList.length > 0 && (
                <div 
                  className="text-xs text-gray-500 line-clamp-3"
                  title={formatBossListWithPartySize(character.bossList)}
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {formatBossListWithPartySize(character.bossList)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}