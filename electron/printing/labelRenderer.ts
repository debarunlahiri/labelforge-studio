interface ServerLabelObject {
  id: string
  type: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  visible: boolean
  locked: boolean
  opacity: number
  [key: string]: any
}

interface ServerTemplateCanvas {
  width: number
  height: number
  unit: string
  dpi: number
  objects: ServerLabelObject[]
}

function convertToDots(value: number, unit: string, dpi: number): number {
  switch (unit) {
    case 'mm':
      return Math.round(value * dpi / 25.4)
    case 'cm':
      return Math.round(value * dpi / 2.54)
    case 'in':
      return Math.round(value * dpi)
    default:
      return Math.round(value)
  }
}

export function generateZPL(templateJson: string): string {
  let canvas: ServerTemplateCanvas
  try {
    canvas = JSON.parse(templateJson)
  } catch {
    return '^XA\n^FT50,50\n^FH\\^FDInvalid template^FS\n^XZ\n'
  }

  const objects: ServerLabelObject[] = canvas.objects || []
  const unit: string = canvas.unit || 'mm'
  const dpi: number = canvas.dpi || 300
  const labelWidth: number = canvas.width || 100
  const labelHeight: number = canvas.height || 50

  const dotWidth = convertToDots(labelWidth, unit, dpi)
  const dotHeight = convertToDots(labelHeight, unit, dpi)

  let zpl = '^XA\n'
  zpl += `^PW${dotWidth}\n`
  zpl += `^LL${dotHeight}\n`

  for (const obj of objects) {
    if (!obj.visible) continue

    const x = convertToDots(obj.x, unit, dpi)
    const y = convertToDots(obj.y, unit, dpi)

    switch (obj.type) {
      case 'text': {
        const fontName = mapFontToZPL(obj.fontFamily || 'Arial')
        const orientation = obj.rotation !== 0 ? 'R' : 'N'
        const heightDots = convertToDots(obj.fontSize || 14, 'pt', dpi)
        const widthDots = Math.round(heightDots * 0.6)
        zpl += `^FO${x},${y}\n`
        zpl += `^A${fontName}${orientation},${heightDots},${widthDots}\n`
        if (obj.bold) {
          zpl += `^WX1\n`
        }
        zpl += `^FD${obj.value || ''}^FS\n`
        break
      }
      case 'barcode': {
        const bcHeight = convertToDots(obj.barcodeHeight || 60, unit, dpi)
        const moduleWidth = obj.moduleWidth || 2
        zpl += `^FO${x},${y}\n`
        zpl += `^BY${moduleWidth}\n`
        const barcodeType = obj.barcodeType || 'Code128'
        if (barcodeType === 'Code128') {
          zpl += `^BC${obj.rotation !== 0 ? 'R' : 'N'},${bcHeight},${obj.showHumanReadable ? 'Y' : 'N'},${obj.showHumanReadable && obj.humanReadablePosition === 'bottom' ? 'Y' : 'N'},N\n`
        } else if (barcodeType === 'Code39') {
          zpl += `^B3${obj.rotation !== 0 ? 'R' : 'N'},${bcHeight},${obj.showHumanReadable ? 'Y' : 'N'},N,N\n`
        } else if (barcodeType === 'EAN13') {
          zpl += `^BE${obj.rotation !== 0 ? 'R' : 'N'},${bcHeight},${obj.showHumanReadable ? 'Y' : 'N'}\n`
        } else {
          zpl += `^BC${obj.rotation !== 0 ? 'R' : 'N'},${bcHeight},${obj.showHumanReadable ? 'Y' : 'N'},Y,N\n`
        }
        zpl += `^FD${obj.value || ''}^FS\n`
        break
      }
      case 'qrcode': {
        const ecLevel = obj.errorCorrectionLevel || 'M'
        const modelSize = 2
        const qrSize = Math.round(Math.min(obj.width || 100, obj.height || 100) / 10)
        const magnification = Math.max(qrSize, 2)
        zpl += `^FO${x},${y}\n`
        zpl += `^BQN,${modelSize},${magnification}\n`
        zpl += `^FD${ecLevel},${obj.value || ''}^FS\n`
        break
      }
      case 'shape': {
        const sWidth = convertToDots(obj.width, unit, dpi)
        const sHeight = convertToDots(obj.height, unit, dpi)
        const borderW = convertToDots(obj.borderWidth || 1, unit, dpi)
        const fillColor = toZPLColor(obj.fillColor || '#FFFFFF')
        const cornerRadius = obj.cornerRadius || 0
        if (cornerRadius > 0) {
          const radius = convertToDots(cornerRadius, unit, dpi)
          zpl += `^FO${x},${y}\n`
          zpl += `^GB${sWidth},${sHeight},${borderW},${fillColor},${radius}^FS\n`
        } else {
          zpl += `^FO${x},${y}\n`
          zpl += `^GB${sWidth},${sHeight},${borderW},${fillColor}^FS\n`
        }
        break
      }
      case 'line': {
        const thickness = convertToDots(obj.lineThickness || 1, unit, dpi) || 1
        const endX = convertToDots((obj.endX || obj.width || 100), unit, dpi)
        const endY = convertToDots((obj.endY || 0), unit, dpi)
        const length = Math.abs(endX - x) || 1
        const height = Math.abs(endY - y) || 1
        if (endX !== 0) {
          zpl += `^FO${x},${y}\n`
          zpl += `^GB${length},1,${thickness},${toZPLColor(obj.lineColor || '#000000')}^FS\n`
        }
        if (endY !== 0) {
          zpl += `^FO${x},${y}\n`
          zpl += `^GB1,${height},${thickness},${toZPLColor(obj.lineColor || '#000000')}^FS\n`
        }
        break
      }
      case 'image': {
        const imgWidth = convertToDots(obj.width, unit, dpi)
        const imgHeight = convertToDots(obj.height, unit, dpi)
        zpl += `^FO${x},${y}\n`
        zpl += `^XG:${obj.source || 'IMAGE'},1,1^FS\n`
        break
      }
      case 'datetime': {
        const dtHeight = convertToDots(14, 'pt', dpi)
        zpl += `^FO${x},${y}\n`
        zpl += `^A0N,${dtHeight},${Math.round(dtHeight * 0.6)}\n`
        zpl += `^FD${new Date().toISOString().split('T')[0]}^FS\n`
        break
      }
      case 'counter': {
        const cHeight = convertToDots(14, 'pt', dpi)
        const padStart = obj.padding || 4
        const startVal = obj.startValue || 1
        const prefix = obj.prefix || ''
        const suffix = obj.suffix || ''
        zpl += `^FO${x},${y}\n`
        zpl += `^A0N,${cHeight},${Math.round(cHeight * 0.6)}\n`
        zpl += `^FD${prefix}${String(startVal).padStart(padStart, '0')}${suffix}^FS\n`
        break
      }
    }
  }

  zpl += '^XZ\n'
  return zpl
}

function mapFontToZPL(fontFamily: string): string {
  const fontMap: Record<string, string> = {
    'Arial': '0',
    'Helvetica': '0',
    'Times New Roman': 'A',
    'Courier': 'B',
    'Courier New': 'B',
    'Verdana': '0',
  }
  return fontMap[fontFamily] || '0'
}

function toZPLColor(color: string): string {
  if (color === '#000000' || color === 'black' || color === '#000') return 'B'
  if (color === '#FFFFFF' || color === 'white' || color === '#fff') return 'W'
  return 'B'
}

export function generateEPL(templateJson: string): string {
  return ''
}

export function generateTSPL(templateJson: string): string {
  return ''
}