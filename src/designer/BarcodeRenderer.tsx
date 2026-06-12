import { useEffect, useState, useMemo, useCallback } from 'react'
import { Group, Rect, Text, Image as KonvaImage } from 'react-konva'
import bwipjs from 'bwip-js'

const BARCODE_TYPE_MAP: Record<string, string> = {
  Code128: 'code128',
  Code39: 'code39',
  EAN13: 'ean13',
  EAN8: 'ean8',
  UPCA: 'upca',
  UPCE: 'upce',
  QRCode: 'qrcode',
  DataMatrix: 'datamatrix',
  PDF417: 'pdf417',
  ITF14: 'itf14',
  GS1128: 'gs1-128',
  GS1DataMatrix: 'gs1datamatrix',
}

interface BarcodeRendererProps {
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
    const opts: bwipjs.EncodeOptions = {
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
  value,
  barcodeType,
  width,
  height,
  options,
  selected,
  onClick,
  onDragEnd,
}: BarcodeRendererProps) {
  const bwipType = useMemo(() => BARCODE_TYPE_MAP[barcodeType] || barcodeType.toLowerCase(), [barcodeType])

  const isQR = useMemo(() => {
    return bwipType === 'qrcode' || bwipType === 'datamatrix' || bwipType === 'gs1datamatrix' || bwipType === 'pdf417'
  }, [bwipType])

  const showHumanReadable = options?.showHumanReadable ?? false
  const foregroundColor = options?.foregroundColor || '#000000'
  const backgroundColor = options?.backgroundColor || '#FFFFFF'
  const humanReadableHeight = showHumanReadable && !isQR ? 18 : 0
  const barcodeAreaHeight = height - humanReadableHeight

  const barcodeResult = useMemo(() => {
    if (!value) return { dataUrl: '', error: 'No value' }
    return renderBarcodeToDataUrl(bwipType, value, width, barcodeAreaHeight, options)
  }, [value, bwipType, width, barcodeAreaHeight, options])

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
      if (onDragEnd) {
        onDragEnd(e.target.x(), e.target.y())
      }
    },
    [onDragEnd]
  )

  return (
    <Group
      onClick={onClick}
      onTap={onClick}
      draggable
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
          text={`[${barcodeType}]`}
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