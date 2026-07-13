'use client'

import { useLayoutEffect, useRef, useState, type ClipboardEvent } from 'react'

import { formatMesoWithKorean, formatNumber } from '../../utils/formatUtils'

const MESO_COPY_ATTRIBUTE = 'data-meso-copy'

function getNormalizedMesoCopyText(scope: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null

  const range = selection.getRangeAt(0)
  if (!range.intersectsNode(scope)) return null

  const selectedMesoAmounts = [
    ...(scope.hasAttribute(MESO_COPY_ATTRIBUTE) ? [scope] : []),
    ...Array.from(scope.querySelectorAll<HTMLElement>(`[${MESO_COPY_ATTRIBUTE}]`)),
  ].filter((element) => range.intersectsNode(element))
  if (selectedMesoAmounts.length === 0) return null

  const fragment = range.cloneContents()
  const mesoAmounts = fragment.querySelectorAll<HTMLElement>(`[${MESO_COPY_ATTRIBUTE}]`)
  mesoAmounts.forEach((element) => {
    element.replaceWith(document.createTextNode(element.getAttribute(MESO_COPY_ATTRIBUTE) || ''))
  })

  const copyContainer = document.createElement('div')
  copyContainer.style.position = 'fixed'
  copyContainer.style.left = '-9999px'
  copyContainer.style.whiteSpace = 'pre-wrap'
  copyContainer.appendChild(fragment)
  document.body.appendChild(copyContainer)
  const normalizedText = copyContainer.innerText
  copyContainer.remove()

  return normalizedText
}

export function handleMesoCopy(event: ClipboardEvent<HTMLElement>) {
  if (event.defaultPrevented) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return

  const currentTargetCopyText = event.currentTarget.getAttribute(MESO_COPY_ATTRIBUTE)
  if (currentTargetCopyText) {
    if (
      event.currentTarget.contains(selection.anchorNode) &&
      event.currentTarget.contains(selection.focusNode)
    ) {
      event.preventDefault()
      event.clipboardData.setData('text/plain', currentTargetCopyText)
    }
    return
  }

  const normalizedText = getNormalizedMesoCopyText(event.currentTarget)
  if (normalizedText === null) return

  event.preventDefault()
  event.clipboardData.setData('text/plain', normalizedText)
}

export function handleMesoDocumentCopy(event: globalThis.ClipboardEvent, scope: HTMLElement) {
  if (event.defaultPrevented || !event.clipboardData) return

  const normalizedText = getNormalizedMesoCopyText(scope)
  if (normalizedText === null) return

  event.preventDefault()
  event.clipboardData.setData('text/plain', normalizedText)
}

interface MesoAmountProps {
  value: number
  compact?: boolean
  allowMultiline?: boolean
  className?: string
  exactClassName?: string
  koreanClassName?: string
  align?: 'left' | 'center' | 'right'
}

export default function MesoAmount({
  value,
  compact = false,
  allowMultiline = false,
  className = '',
  exactClassName = '',
  koreanClassName = '',
  align = 'right',
}: MesoAmountProps) {
  const exact = formatNumber(value)
  const korean = formatMesoWithKorean(value, true) || exact
  const copyText = `${exact} (${korean}) 메소`
  const absoluteValue = Math.abs(Math.floor(value))
  const hasTruncatedMeso = absoluteValue >= 10_000 && absoluteValue % 10_000 !== 0
  const showExact = !compact && hasTruncatedMeso
  const exactRef = useRef<HTMLSpanElement>(null)
  const koreanRef = useRef<HTMLSpanElement>(null)
  const [isExactWider, setIsExactWider] = useState(false)
  const [verticalOffset, setVerticalOffset] = useState(8)
  const [exactGapReduction, setExactGapReduction] = useState(1)
  const alignClass = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[align]

  useLayoutEffect(() => {
    if (compact || allowMultiline) return

    const getTextWidth = (element: HTMLElement) => {
      const range = document.createRange()
      range.selectNodeContents(element)
      return range.getBoundingClientRect().width
    }

    const updateWidthComparison = () => {
      if (!exactRef.current || !koreanRef.current) return
      setIsExactWider(
        getTextWidth(exactRef.current) > getTextWidth(koreanRef.current)
      )
    }

    updateWidthComparison()
    let isActive = true
    document.fonts.ready.then(() => {
      if (isActive) updateWidthComparison()
    })

    const observer = new ResizeObserver(updateWidthComparison)
    if (exactRef.current) observer.observe(exactRef.current)
    if (koreanRef.current) observer.observe(koreanRef.current)

    return () => {
      isActive = false
      observer.disconnect()
    }
  }, [allowMultiline, compact, exact, isExactWider, korean])

  useLayoutEffect(() => {
    const updateVerticalOffset = () => {
      if (!koreanRef.current) return
      const fontSize = Number.parseFloat(window.getComputedStyle(koreanRef.current).fontSize)
      if (Number.isFinite(fontSize)) {
        const normalizedFontSize = Math.min(16, Math.max(12, fontSize))
        const normalizedProgress = (normalizedFontSize - 12) / 4
        const offsetRatio = 0.05 + normalizedProgress ** 2 * 0.45
        setVerticalOffset(fontSize * offsetRatio)
        setExactGapReduction(1 + Math.max(0, fontSize - 14) * 0.25)
      }
    }

    updateVerticalOffset()
    let isActive = true
    document.fonts.ready.then(() => {
      if (isActive) updateVerticalOffset()
    })

    const observer = new ResizeObserver(updateVerticalOffset)
    if (koreanRef.current) observer.observe(koreanRef.current)

    return () => {
      isActive = false
      observer.disconnect()
    }
  }, [allowMultiline, compact, isExactWider, korean, koreanClassName])

  const exactAmount = !compact && (
    <span
      ref={exactRef}
      className={`whitespace-nowrap text-right font-mono text-[10px] font-normal leading-none tabular-nums text-gray-400 ${showExact ? '' : 'invisible'} ${exactClassName}`}
      style={{ marginBottom: `-${exactGapReduction}px` }}
    >
      {exact}
    </span>
  )
  const koreanAmount = (
    <span
      ref={koreanRef}
      className={`${allowMultiline ? 'whitespace-normal break-keep' : 'whitespace-nowrap'} text-right font-semibold ${koreanClassName}`}
    >
      {korean}
    </span>
  )
  const mesoSuffix = <span className={`whitespace-nowrap pl-1 font-semibold ${koreanClassName}`}>메소</span>

  return (
    <span
      className={`inline-flex max-w-full flex-col leading-tight ${alignClass} ${className}`}
      style={{ transform: `translateY(-${verticalOffset}px)` }}
      onCopy={handleMesoCopy}
      data-meso-copy={copyText}
      aria-label={copyText}
      title={exact}
    >
      <span className="sr-only">{copyText}</span>
      <span className="max-w-full select-none" aria-hidden="true">
        {allowMultiline ? (
          <span className="flex max-w-full flex-col items-end justify-end">
            <span className="inline-flex max-w-full flex-col items-end">
              {exactAmount}
              {koreanAmount}
            </span>
            {mesoSuffix}
          </span>
        ) : compact ? (
          <span className="flex max-w-full flex-wrap items-end justify-end">
            <span className="inline-flex shrink-0 flex-col items-end">{koreanAmount}</span>
            {mesoSuffix}
          </span>
        ) : isExactWider ? (
          <span className="inline-flex max-w-full flex-col items-start">
            {exactAmount}
            <span className="flex max-w-full flex-wrap items-baseline">
              {koreanAmount}
              {mesoSuffix}
            </span>
          </span>
        ) : (
          <span className="flex max-w-full flex-wrap items-end justify-end">
            <span className="inline-flex shrink-0 flex-col items-end">
              {exactAmount}
              {koreanAmount}
            </span>
            {mesoSuffix}
          </span>
        )}
      </span>
    </span>
  )
}
