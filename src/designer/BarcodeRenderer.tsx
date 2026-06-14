import { useEffect, useState, useMemo, useCallback } from 'react'
import { Group, Rect, Text, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import bwipjs from 'bwip-js'
import { getBwipSymbology, getSymbologyLabel, isQrFamilySymbology, symbologyByValue } from './symbologies'

interface BarcodeRendererProps {
  id?: string
  x?: number
  y?: number
  rotation?: number
  name?: string
  value: string
  barcodeType: string
  width: number
  height: number
  options?: {
    moduleWidth?: number
    showHumanReadable?: boolean
    humanReadablePosition?: string
    barcodeHeight?: number
    quietZone?: number
    foregroundColor?: string
    backgroundColor?: string
    errorCorrectionLevel?: string
  }
  selected?: boolean
  onClick?: (e: any) => void
  onMouseDown?: (e: any) => void
  onContextMenu?: (e: any) => void
  onDragMove?: (e: any) => void
  onDragEnd?: (x: number, y: number) => void
}

interface BarcodeResult {
  dataUrl: string
  error: string | null
}

function renderBarcodeToDataUrl(
  bwipType: string,
  value: string,
  width: number,
  height: number,
  options: BarcodeRendererProps['options']
): BarcodeResult {
  try {
    const canvas = document.createElement('canvas')
    const opts: any = {
      bcid: bwipType,
      text: value,
      scale: 3,
      width: width,
      height: options?.barcodeHeight || height,
      includetext: options?.showHumanReadable ?? false,
      barcolor: options?.foregroundColor || '000000',
      backgroundcolor: options?.backgroundColor || 'FFFFFF',
    }

    if (options?.moduleWidth) {
      opts.modulewidth = options.moduleWidth
    }

    if (options?.quietZone) {
      opts.quirk = options.quietZone
    }

    if (bwipType === 'qrcode' && options?.errorCorrectionLevel) {
      const levelMap: Record<string, string> = { L: 'L', M: 'M', Q: 'Q', H: 'H' }
      opts.eclevel = levelMap[options.errorCorrectionLevel] || 'M'
    }

    bwipjs.toCanvas(canvas, opts)
    return { dataUrl: canvas.toDataURL('image/png'), error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid barcode value'
    return { dataUrl: '', error: message }
  }
}

export default function BarcodeRenderer({
  id,
  x = 0,
  y = 0,
  rotation = 0,
  name,
  value,
  barcodeType,
  width,
  height,
  options,
  selected,
  onClick,
  onMouseDown,
  onContextMenu,
  onDragMove,
  onDragEnd,
}: BarcodeRendererProps) {
  const symbology = symbologyByValue[barcodeType]
  const bwipType = useMemo(() => getBwipSymbology(barcodeType), [barcodeType])

  const isQR = useMemo(() => {
    return bwipType === 'qrcode' || bwipType === 'datamatrix' || bwipType === 'gs1datamatrix' || bwipType === 'pdf417' || bwipType === 'azteccode' || bwipType === 'maxicode'
  }, [bwipType])

  const showHumanReadable = options?.showHumanReadable ?? false
  const foregroundColor = options?.foregroundColor || '#000000'
  const backgroundColor = options?.backgroundColor || '#FFFFFF'
  const humanReadableHeight = showHumanReadable && !isQR ? 18 : 0
  const barcodeAreaHeight = height - humanReadableHeight

  const barcodeResult = useMemo(() => {
    if (symbology?.supported === false || !bwipType) {
      return { dataUrl: '', error: `${getSymbologyLabel(barcodeType)} is listed but not renderable in this preview engine yet` }
    }
    if (!value) return { dataUrl: '', error: 'No value' }
    const result = renderBarcodeToDataUrl(bwipType, value, width, barcodeAreaHeight, options)
    if (result.error && isQrFamilySymbology(barcodeType) && bwipType !== 'qrcode') {
      return renderBarcodeToDataUrl('qrcode', value, width, barcodeAreaHeight, options)
    }
    return result
  }, [barcodeType, symbology, value, bwipType, width, barcodeAreaHeight, options])

  const hasError = !value || !!barcodeResult.error

  const [barcodeImage, setBarcodeImage] = useState<HTMLImageElement | null>(null)
  const [loadedSrc, setLoadedSrc] = useState('')

  useEffect(() => {
    if (hasError || !barcodeResult.dataUrl) return

    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (!cancelled) {
        setBarcodeImage(img)
        setLoadedSrc(barcodeResult.dataUrl)
      }
    }
    img.onerror = () => {
      if (!cancelled) setBarcodeImage(null)
    }
    img.src = barcodeResult.dataUrl

    return () => { cancelled = true }
  }, [hasError, barcodeResult.dataUrl])

  const currentBarcodeImage = !hasError && loadedSrc === barcodeResult.dataUrl ? barcodeImage : null

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.currentTarget
      if (onDragEnd) {
        onDragEnd(node.x(), node.y())
      }
    },
    [onDragEnd]
  )

  return (
    <Group
      id={id}
      x={x}
      y={y}
      rotation={rotation}
      name={name}
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      draggable
      onDragMove={onDragMove}
      onDragEnd={handleDragEnd}
    >
      <Rect
        width={width}
        height={height}
        fill={backgroundColor}
        stroke={selected ? '#2563eb' : 'transparent'}
        strokeWidth={selected ? 2 : 0}
      />

      {hasError && (
        <Group>
          <Rect
            width={width}
            height={height}
            fill="#FEF2F2"
            stroke="#FCA5A5"
            strokeWidth={1}
          />
          <Text
            text={`Invalid ${barcodeType}`}
            fontSize={11}
            fill="#DC2626"
            width={width}
            height={barcodeAreaHeight}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}

      {!hasError && currentBarcodeImage && (
        <KonvaImage
          image={currentBarcodeImage}
          width={width}
          height={barcodeAreaHeight}
        />
      )}

      {!hasError && !currentBarcodeImage && (
        <Text
          text={`[${getSymbologyLabel(barcodeType)}]`}
          fontSize={12}
          fill={foregroundColor}
          width={width}
          height={barcodeAreaHeight}
          align="center"
          verticalAlign="middle"
        />
      )}

      {showHumanReadable && !isQR && (
        <Text
          text={value}
          fontSize={10}
          fill={foregroundColor}
          width={width}
          y={barcodeAreaHeight}
          align="center"
        />
      )}
    </Group>
  )
}
