import { Shape } from 'react-konva'
import type { TextObject } from '../types'
import { styleAt } from './richText'

type Props = {
  object: TextObject
  id?: string
  visible?: boolean
  draggable?: boolean
  onClick?: (event: any) => void
  onTap?: (event: any) => void
  onMouseDown?: (event: any) => void
  onContextMenu?: (event: any) => void
  onDblClick?: () => void
  onDblTap?: () => void
  onDragMove?: (event: any) => void
  onDragEnd?: (event: any) => void
}

export default function RichTextRenderer({ object, ...events }: Props) {
  return (
    <Shape
      {...events}
      x={object.x}
      y={object.y}
      width={object.width}
      height={object.height}
      rotation={object.rotation}
      opacity={object.opacity}
      sceneFunc={(context, shape) => {
        const ctx = context._context
        ctx.save()
        if (object.backgroundColor && object.backgroundColor !== 'transparent') {
          ctx.fillStyle = object.backgroundColor
          ctx.fillRect(0, 0, object.width, object.height)
        }
        const lines = object.value.split('\n')
        let y = 0
        let globalIndex = 0
        for (const line of lines) {
          const chars = [...line]
          const widths = chars.map((char, index) => {
            const style = styleAt(object, globalIndex + index)
            ctx.font = `${style.italic ? 'italic ' : ''}${style.bold ? 'bold ' : ''}${style.fontSize}px "${style.fontFamily}", sans-serif`
            return ctx.measureText(char).width + object.letterSpacing
          })
          const lineWidth = widths.reduce((sum, width) => sum + width, 0)
          let x = object.horizontalAlign === 'center' ? (object.width - lineWidth) / 2 : object.horizontalAlign === 'right' ? object.width - lineWidth : 0
          const maxSize = chars.reduce((size, _, index) => Math.max(size, styleAt(object, globalIndex + index).fontSize), object.fontSize)
          const lineHeight = maxSize * object.lineHeight
          const baseline = y + maxSize
          chars.forEach((char, index) => {
            const style = styleAt(object, globalIndex + index)
            ctx.font = `${style.italic ? 'italic ' : ''}${style.bold ? 'bold ' : ''}${style.fontSize}px "${style.fontFamily}", sans-serif`
            ctx.fillStyle = style.textColor
            ctx.textBaseline = 'alphabetic'
            ctx.fillText(char, x, baseline)
            if (style.underline) {
              ctx.strokeStyle = style.textColor
              ctx.lineWidth = Math.max(1, style.fontSize / 14)
              ctx.beginPath()
              ctx.moveTo(x, baseline + 2)
              ctx.lineTo(x + widths[index] - object.letterSpacing, baseline + 2)
              ctx.stroke()
            }
            x += widths[index]
          })
          y += lineHeight
          globalIndex += line.length + 1
          if (y > object.height) break
        }
        ctx.restore()
        context.fillStrokeShape(shape)
      }}
      hitFunc={(context, shape) => {
        context.beginPath()
        context.rect(0, 0, object.width, object.height)
        context.closePath()
        context.fillStrokeShape(shape)
      }}
    />
  )
}
