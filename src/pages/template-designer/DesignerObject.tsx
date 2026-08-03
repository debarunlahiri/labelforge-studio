import { Group, Line, Rect, Text } from 'react-konva'
import type {
  BarcodeObject,
  CounterObject,
  DateTimeObject,
  ImageObject,
  LabelObject,
  LineObject,
  QRCodeObject,
  ShapeObject,
  TextObject,
} from '../../types'
import BarcodeRenderer from '../../designer/BarcodeRenderer'
import ImageRenderer from '../../designer/ImageRenderer'
import RichTextRenderer from '../../designer/RichTextRenderer'
import ShapeRenderer from '../../designer/ShapeRenderer'
import { formatCounter, formatDateTimeObject } from '../../utils/dynamicFields'
import { getLineNodePosition, getLineVisualHeight } from './canvasGeometry'

type DesignerObjectProps = {
  object: LabelObject
  selected: boolean
  flashing: boolean
  inlineEditing: boolean
  onSelect: (objectId: string, multiple: boolean) => void
  onMouseDown: (objectId: string, event: any) => void
  onContextMenu: (objectId: string, event: any) => void
  onEditText: (object: TextObject) => void
  onDragMove: (object: LabelObject, event: any) => void
  onDragEnd: (object: LabelObject, event: any) => void
  onRendererDragEnd: (object: LabelObject, x: number, y: number) => void
}

const getNodeId = (id: string) => `object-${id}`

export default function DesignerObject({
  object,
  selected,
  flashing,
  inlineEditing,
  onSelect,
  onMouseDown,
  onContextMenu,
  onEditText,
  onDragMove,
  onDragEnd,
  onRendererDragEnd,
}: DesignerObjectProps) {
  const selectionStroke = flashing ? '#f59e0b' : '#2563eb'
  const selectionWidth = flashing ? 3 : 2
  const highlighted = selected || flashing
  const pointerProps = {
    onClick: (event: any) => onSelect(object.id, event.evt.metaKey || event.evt.ctrlKey),
    onMouseDown: (event: any) => onMouseDown(object.id, event),
    onContextMenu: (event: any) => onContextMenu(object.id, event),
    onTap: () => onSelect(object.id, false),
  }
  const dragProps = {
    draggable: true,
    onDragMove: (event: any) => onDragMove(object, event),
    onDragEnd: (event: any) => onDragEnd(object, event),
  }

  switch (object.type) {
    case 'text': {
      const text = object as TextObject
      return (
        <RichTextRenderer
          object={text}
          id={getNodeId(object.id)}
          visible={!inlineEditing}
          {...pointerProps}
          onDblClick={() => onEditText(text)}
          onDblTap={() => onEditText(text)}
          {...dragProps}
        />
      )
    }
    case 'barcode': {
      const barcode = object as BarcodeObject
      return (
        <BarcodeRenderer
          id={getNodeId(object.id)}
          x={object.x}
          y={object.y}
          rotation={object.rotation}
          value={barcode.value}
          barcodeType={barcode.barcodeType}
          width={object.width}
          height={object.height}
          options={{
            showHumanReadable: barcode.showHumanReadable,
            moduleWidth: barcode.moduleWidth,
            barcodeHeight: barcode.barcodeHeight,
            quietZone: barcode.quietZone,
            foregroundColor: barcode.foregroundColor,
            backgroundColor: barcode.backgroundColor,
          }}
          selected={highlighted}
          {...pointerProps}
          onDragMove={(event) => onDragMove(object, event)}
          onDragEnd={(x, y) => onRendererDragEnd(object, x, y)}
        />
      )
    }
    case 'qrcode': {
      const qrCode = object as QRCodeObject
      return (
        <BarcodeRenderer
          id={getNodeId(object.id)}
          x={object.x}
          y={object.y}
          rotation={object.rotation}
          value={qrCode.value}
          barcodeType={qrCode.barcodeType || 'QRCode'}
          width={object.width}
          height={object.height}
          options={{
            showHumanReadable: qrCode.showHumanReadable ?? false,
            errorCorrectionLevel: qrCode.errorCorrectionLevel,
            quietZone: qrCode.quietZone,
            foregroundColor: qrCode.foregroundColor,
            backgroundColor: qrCode.backgroundColor,
          }}
          selected={highlighted}
          {...pointerProps}
          onDragMove={(event) => onDragMove(object, event)}
          onDragEnd={(x, y) => onRendererDragEnd(object, x, y)}
        />
      )
    }
    case 'shape': {
      const shape = object as ShapeObject
      return (
        <ShapeRenderer
          object={shape}
          id={getNodeId(object.id)}
          stroke={highlighted ? selectionStroke : shape.borderColor}
          strokeWidth={highlighted ? selectionWidth : shape.borderWidth}
          {...pointerProps}
          {...dragProps}
        />
      )
    }
    case 'image': {
      const image = object as ImageObject
      return (
        <ImageRenderer
          id={getNodeId(object.id)}
          source={image.source}
          x={object.x}
          y={object.y}
          width={object.width}
          height={object.height}
          rotation={object.rotation}
          opacity={object.opacity}
          maintainAspectRatio={image.maintainAspectRatio}
          fitMode={image.fitMode}
          cropX={image.cropX}
          cropY={image.cropY}
          flipHorizontal={image.flipHorizontal}
          flipVertical={image.flipVertical}
          selected={highlighted}
          {...pointerProps}
          {...dragProps}
        />
      )
    }
    case 'line': {
      const line = object as LineObject
      const lineHeight = getLineVisualHeight(line)
      const position = getLineNodePosition(line)
      const dragObject = { ...object, x: position.x, y: position.y }
      return (
        <Group
          id={getNodeId(object.id)}
          x={position.x}
          y={position.y}
          width={Math.max(4, object.width)}
          height={lineHeight}
          rotation={object.rotation}
          {...pointerProps}
          draggable
          onDragMove={(event) => onDragMove(dragObject, event)}
          onDragEnd={(event) => onDragEnd(dragObject, event)}
        >
          <Rect x={-object.width / 2} y={-lineHeight / 2} width={Math.max(4, object.width)} height={lineHeight} fill="transparent" stroke={highlighted ? selectionStroke : 'transparent'} strokeWidth={highlighted ? selectionWidth : 0} />
          <Line points={[-object.width / 2, 0, object.width / 2, 0]} stroke={highlighted ? selectionStroke : line.lineColor} strokeWidth={flashing ? Math.max(line.lineThickness + 2, 3) : line.lineThickness} shadowColor={flashing ? '#f59e0b' : undefined} shadowBlur={flashing ? 10 : 0} shadowOpacity={flashing ? 0.35 : 0} hitStrokeWidth={12} />
        </Group>
      )
    }
    case 'counter':
      return <SimpleObject object={object} text={formatCounter(object as CounterObject)} fill="white" baseStroke="#999" textColor="#333" monospace {...pointerProps} {...dragProps} highlighted={highlighted} flashing={flashing} selectionStroke={selectionStroke} selectionWidth={selectionWidth} />
    case 'datetime':
      return <SimpleObject object={object} text={formatDateTimeObject(object as DateTimeObject)} fill="white" baseStroke="#999" textColor="#333" {...pointerProps} {...dragProps} highlighted={highlighted} flashing={flashing} selectionStroke={selectionStroke} selectionWidth={selectionWidth} />
    case 'rfid':
      return <SimpleObject object={object} text="RFID" fill="#e8f4f8" baseStroke="#0066cc" textColor="#0066cc" {...pointerProps} {...dragProps} highlighted={highlighted} flashing={flashing} selectionStroke={selectionStroke} selectionWidth={selectionWidth} />
    default:
      return <Rect id={getNodeId(object.id)} x={object.x} y={object.y} width={object.width} height={object.height} fill="#e0e0e0" stroke={highlighted ? selectionStroke : '#999'} strokeWidth={highlighted ? selectionWidth : 1} shadowColor={flashing ? '#f59e0b' : undefined} shadowBlur={flashing ? 10 : 0} shadowOpacity={flashing ? 0.35 : 0} {...pointerProps} {...dragProps} />
  }
}

function SimpleObject({ object, text, fill, baseStroke, textColor, monospace = false, highlighted, flashing, selectionStroke, selectionWidth, ...events }: any) {
  return (
    <Group id={getNodeId(object.id)} x={object.x} y={object.y} rotation={object.rotation} {...events}>
      <Rect width={object.width} height={object.height} fill={fill} stroke={highlighted ? selectionStroke : baseStroke} strokeWidth={highlighted ? selectionWidth : 1} shadowColor={flashing ? '#f59e0b' : undefined} shadowBlur={flashing ? 10 : 0} shadowOpacity={flashing ? 0.35 : 0} />
      <Text text={text} fontSize={object.type === 'counter' ? 14 : 12} fontFamily={monospace ? 'monospace' : undefined} fill={textColor} width={object.width} height={object.height} align="center" verticalAlign="middle" />
    </Group>
  )
}
