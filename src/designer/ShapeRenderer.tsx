import { Circle, Ellipse, Rect, RegularPolygon } from 'react-konva'
import type { ShapeObject } from '../types'

type ShapeRendererProps = {
  object: ShapeObject
  stroke: string
  strokeWidth: number
  id?: string
  selected?: boolean
  draggable?: boolean
  onClick?: (event: any) => void
  onMouseDown?: (event: any) => void
  onContextMenu?: (event: any) => void
  onDragMove?: (event: any) => void
  onDragEnd?: (event: any) => void
}

export default function ShapeRenderer({
  object, stroke, strokeWidth, id, draggable, onClick, onMouseDown, onContextMenu, onDragMove, onDragEnd,
}: ShapeRendererProps) {
  const common = {
    id,
    x: object.x,
    y: object.y,
    rotation: object.rotation,
    fill: object.fillColor,
    stroke,
    strokeWidth,
    opacity: object.opacity,
    draggable,
    onClick,
    onTap: onClick,
    onMouseDown,
    onContextMenu,
    onDragMove,
    onDragEnd,
  }

  if (object.shapeType === 'circle') {
    const diameter = Math.min(object.width, object.height)
    return <Circle {...common} x={object.x + object.width / 2} y={object.y + object.height / 2} radius={diameter / 2} />
  }
  if (object.shapeType === 'ellipse') {
    return <Ellipse {...common} x={object.x + object.width / 2} y={object.y + object.height / 2} radiusX={object.width / 2} radiusY={object.height / 2} />
  }
  if (object.shapeType === 'triangle') {
    return <RegularPolygon {...common} x={object.x + object.width / 2} y={object.y + object.height / 2} sides={3} radius={Math.min(object.width, object.height) / 2} />
  }
  if (object.shapeType === 'polygon') {
    return <RegularPolygon {...common} x={object.x + object.width / 2} y={object.y + object.height / 2} sides={6} radius={Math.min(object.width, object.height) / 2} />
  }
  return (
    <Rect
      {...common}
      width={object.width}
      height={object.height}
      cornerRadius={object.shapeType === 'roundedRectangle' ? Math.max(object.cornerRadius, 12) : object.cornerRadius}
    />
  )
}
