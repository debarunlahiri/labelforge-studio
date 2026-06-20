import { useEffect, useState } from 'react'
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva'
import type Konva from 'konva'

type ImageRendererProps = {
  id?: string
  source: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity?: number
  maintainAspectRatio?: boolean
  fitMode?: 'contain' | 'cover' | 'stretch'
  cropX?: number
  cropY?: number
  flipHorizontal?: boolean
  flipVertical?: boolean
  selected?: boolean
  draggable?: boolean
  onClick?: (event: any) => void
  onMouseDown?: (event: any) => void
  onContextMenu?: (event: any) => void
  onDragMove?: (event: any) => void
  onDragEnd?: (event: any) => void
}

export default function ImageRenderer({
  id, source, x, y, width, height, rotation, opacity = 1, maintainAspectRatio = true,
  fitMode = 'contain', cropX = 50, cropY = 50, flipHorizontal = false, flipVertical = false,
  selected, draggable, onClick, onMouseDown, onContextMenu, onDragMove, onDragEnd,
}: ImageRendererProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setImage(null)
    setFailed(false)
    if (!source) return
    const nextImage = new window.Image()
    nextImage.crossOrigin = 'anonymous'
    nextImage.onload = () => setImage(nextImage)
    nextImage.onerror = () => setFailed(true)
    nextImage.src = source
    return () => {
      nextImage.onload = null
      nextImage.onerror = null
    }
  }, [source])

  let drawX = 0
  let drawY = 0
  let drawWidth = width
  let drawHeight = height
  let imageCrop: { x: number; y: number; width: number; height: number } | undefined
  if (image && fitMode === 'cover') {
    const targetRatio = width / height
    const sourceRatio = image.naturalWidth / image.naturalHeight
    let cropWidth = image.naturalWidth
    let cropHeight = image.naturalHeight
    if (sourceRatio > targetRatio) cropWidth = image.naturalHeight * targetRatio
    else cropHeight = image.naturalWidth / targetRatio
    imageCrop = {
      x: (image.naturalWidth - cropWidth) * Math.max(0, Math.min(100, cropX)) / 100,
      y: (image.naturalHeight - cropHeight) * Math.max(0, Math.min(100, cropY)) / 100,
      width: cropWidth,
      height: cropHeight,
    }
  } else if (image && fitMode === 'contain' && maintainAspectRatio) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
    drawWidth = image.naturalWidth * scale
    drawHeight = image.naturalHeight * scale
    drawX = (width - drawWidth) / 2
    drawY = (height - drawHeight) / 2
  }

  return (
    <Group
      id={id}
      x={x}
      y={y}
      rotation={rotation}
      opacity={opacity}
      draggable={draggable}
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <Rect width={width} height={height} fill="#f8fafc" stroke={selected ? '#2563eb' : '#cbd5e1'} strokeWidth={selected ? 2 : 1} />
      {image && (
        <KonvaImage
          image={image}
          x={flipHorizontal ? drawX + drawWidth : drawX}
          y={flipVertical ? drawY + drawHeight : drawY}
          width={drawWidth}
          height={drawHeight}
          scaleX={flipHorizontal ? -1 : 1}
          scaleY={flipVertical ? -1 : 1}
          crop={imageCrop}
        />
      )}
      {!image && (
        <Text
          text={failed ? 'Image could not be loaded' : source ? 'Loading image…' : 'Choose an image'}
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
          fontSize={12}
          fill={failed ? '#dc2626' : '#64748b'}
        />
      )}
    </Group>
  )
}
