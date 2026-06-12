import type {
  LabelObject,
  TextObject,
  BarcodeObject,
  QRCodeObject,
  ShapeObject,
  LineObject,
  ImageObject,
  DateTimeObject,
  CounterObject,
} from '../types'

function convertToDots(value: number, unit: string, dpi: number): number {
  switch (unit) {
    case 'mm':
      return Math.round(value * dpi / 25.4)
    case 'cm':
      return Math.round(value * dpi / 2.54)
    case 'in':
      return Math.round(value * dpi)
    case 'px':
    default:
      return Math.round(value)
  }
}

export function renderToCanvas(
  objects: LabelObject[],
  width: number,
  height: number,
  dpi: number,
  unit: string
): HTMLCanvasElement {
  const pixelWidth = convertToPixels(width, unit, dpi)
  const pixelHeight = convertToPixels(height, unit, dpi)

  const canvas = document.createElement('canvas')
  canvas.width = pixelWidth
  canvas.height = pixelHeight
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, pixelWidth, pixelHeight)

  const scaleX = pixelWidth / convertToPixels(width, unit, 96)
  const scaleY = pixelHeight / convertToPixels(height, unit, 96)
  ctx.scale(scaleX, scaleY)

  for (const obj of objects) {
    if (!obj.visible) continue
    ctx.save()
    ctx.translate(obj.x, obj.y)
    ctx.rotate((obj.rotation * Math.PI) / 180)
    ctx.globalAlpha = obj.opacity

    switch (obj.type) {
      case 'text': {
        const t = obj as TextObject
        ctx.fillStyle = t.backgroundColor && t.backgroundColor !== 'transparent' ? t.backgroundColor : 'transparent'
        if (t.backgroundColor && t.backgroundColor !== 'transparent') {
          ctx.fillRect(0, 0, obj.width, obj.height)
        }
        const fontStyle = `${t.italic ? 'italic ' : ''}${t.bold ? 'bold ' : ''}${t.fontSize}px ${t.fontFamily}`
        ctx.font = fontStyle
        ctx.fillStyle = t.textColor
        ctx.textAlign = t.horizontalAlign as CanvasTextAlign
        ctx.textBaseline = t.verticalAlign === 'middle' ? 'middle' : t.verticalAlign === 'bottom' ? 'bottom' : 'top'
        const textX = t.horizontalAlign === 'center' ? obj.width / 2 : t.horizontalAlign === 'right' ? obj.width : 0
        const textY = t.verticalAlign === 'middle' ? obj.height / 2 : t.verticalAlign === 'bottom' ? obj.height : 0
        if (t.underline) {
          ctx.textDecoration = 'underline'
        }
        ctx.fillText(t.value, textX, textY)
        break
      }
      case 'barcode': {
        const bc = obj as BarcodeObject
        ctx.fillStyle = bc.backgroundColor
        ctx.fillRect(0, 0, obj.width, obj.height)
        ctx.fillStyle = bc.foregroundColor
        ctx.font = `12px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`[${bc.barcodeType}]`, obj.width / 2, (obj.height - (bc.showHumanReadable ? 16 : 0)) / 2)
        if (bc.showHumanReadable) {
          ctx.font = `10px Arial`
          ctx.textBaseline = 'bottom'
          ctx.fillText(bc.value, obj.width / 2, obj.height)
        }
        break
      }
      case 'qrcode': {
        const qr = obj as QRCodeObject
        ctx.fillStyle = qr.backgroundColor
        ctx.fillRect(0, 0, obj.width, obj.height)
        ctx.fillStyle = qr.foregroundColor
        ctx.fillRect(8, 8, obj.width - 16, obj.height - 16)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `bold 14px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('QR', obj.width / 2, obj.height / 2)
        break
      }
      case 'shape': {
        const s = obj as ShapeObject
        ctx.fillStyle = s.fillColor
        ctx.strokeStyle = s.borderColor
        ctx.lineWidth = s.borderWidth
        if (s.cornerRadius > 0) {
          ctx.beginPath()
          ctx.roundRect(0, 0, obj.width, obj.height, s.cornerRadius)
          ctx.fill()
          ctx.stroke()
        } else {
          ctx.fillRect(0, 0, obj.width, obj.height)
          ctx.strokeRect(0, 0, obj.width, obj.height)
        }
        break
      }
      case 'line': {
        const l = obj as LineObject
        ctx.strokeStyle = l.lineColor
        ctx.lineWidth = l.lineThickness
        if (l.lineStyle === 'dashed') {
          ctx.setLineDash([8, 4])
        } else if (l.lineStyle === 'dotted') {
          ctx.setLineDash([2, 2])
        }
        ctx.beginPath()
        ctx.moveTo(l.startX, l.startY)
        ctx.lineTo(l.endX, l.endY)
        ctx.stroke()
        break
      }
      case 'image': {
        const img = obj as ImageObject
        ctx.strokeStyle = '#999'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.strokeRect(0, 0, obj.width, obj.height)
        ctx.setLineDash([])
        ctx.fillStyle = '#999'
        ctx.font = '11px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('[Image]', obj.width / 2, obj.height / 2)
        break
      }
      case 'datetime': {
        const dt = obj as DateTimeObject
        const dateStr = new Date().toLocaleDateString()
        ctx.fillStyle = '#000000'
        ctx.font = '14px Arial'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(dateStr, 0, 0)
        break
      }
      case 'counter': {
        const c = obj as CounterObject
        const counterStr = `${c.prefix}${String(c.startValue).padStart(c.padding, '0')}${c.suffix}`
        ctx.fillStyle = '#000000'
        ctx.font = '14px Arial'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(counterStr, 0, 0)
        break
      }
    }
    ctx.restore()
  }

  return canvas
}

function convertToPixels(value: number, unit: string, dpi: number): number {
  switch (unit) {
    case 'mm':
      return Math.round(value * dpi / 25.4)
    case 'cm':
      return Math.round(value * dpi / 2.54)
    case 'in':
      return Math.round(value * dpi)
    case 'px':
    default:
      return Math.round(value)
  }
}

export async function renderToPNG(
  objects: LabelObject[],
  width: number,
  height: number,
  dpi: number,
  unit: string
): Promise<string> {
  const canvas = renderToCanvas(objects, width, height, dpi, unit)
  return canvas.toDataURL('image/png')
}

export async function renderToPDF(
  objects: LabelObject[],
  width: number,
  height: number,
  dpi: number,
  unit: string,
  templateName: string
): Promise<Blob> {
  const canvas = renderToCanvas(objects, width, height, dpi, unit)
  const imgDataUrl = canvas.toDataURL('image/png')
  const imgData = imgDataUrl.split(',')[1]

  const widthInPt = unit === 'mm' ? width * 2.835 : unit === 'cm' ? width * 28.35 : unit === 'in' ? width * 72 : width * 0.75
  const heightInPt = unit === 'mm' ? height * 2.835 : unit === 'cm' ? height * 28.35 : unit === 'in' ? height * 72 : height * 0.75

  const pdfContent = buildSimplePDF(imgData, widthInPt, heightInPt, canvas.width, canvas.height)

  return Promise.resolve(new Blob([pdfContent], { type: 'application/pdf' }))
}

function buildSimplePDF(
  imageData: string,
  widthPt: number,
  heightPt: number,
  pixelWidth: number,
  pixelHeight: number
): Uint8Array {
  const imgBytes = atob(imageData)
  const imgUint8 = new Uint8Array(imgBytes.length)
  for (let i = 0; i < imgBytes.length; i++) {
    imgUint8[i] = imgBytes.charCodeAt(i)
  }

  const header = '%PDF-1.4\n'
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] /Contents 4 0 R /Resources << /XObject << /Img1 5 0 R >> >> >>\nendobj\n`

  const contentStream = `q\n${widthPt} 0 0 ${heightPt} 0 0 cm\n/Img1 Do\nQ\n`
  const obj4 = `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`

  const obj5 = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgUint8.length} >>\nstream\n`

  const imageDataStr = String.fromCharCode(...imgUint8)

  const obj6 = '6 0 obj\n<< /Producer (LabelForge Studio) >>\nendobj\n'

  let pdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + imageDataStr + '\nendstream\nendobj\n' + obj6

  const offsets: number[] = []
  let pos = 0
  const parts = pdf.split('\n')
  let currentObj = 0
  let currentOffset = 0

  for (let i = 1; i <= 6; i++) {
    const marker = `${i} 0 obj`
    const idx = pdf.indexOf(marker)
    if (idx !== -1) {
      offsets.push(idx)
    }
  }

  const xref = `xref\n0 7\n0000000000 65535 f \n${offsets[0].toString().padStart(10, '0')} 00000 n \n${offsets[1].toString().padStart(10, '0')} 00000 n \n${offsets[2].toString().padStart(10, '0')} 00000 n \n${offsets[3].toString().padStart(10, '0')} 00000 n \n${offsets[4].toString().padStart(10, '0')} 00000 n \n${offsets[5].toString().padStart(10, '0')} 00000 n \n`
  const trailer = `trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n0\n%%EOF\n`

  const fullPdf = pdf + xref + trailer

  const encoder = new TextEncoder()
  const pdfUint8 = encoder.encode(fullPdf)
  return pdfUint8
}

export function renderToZPL(
  objects: LabelObject[],
  width: number,
  height: number,
  unit: string
): string {
  const dpi = 300
  const dotWidth = convertToDots(width, unit, dpi)
  const dotHeight = convertToDots(height, unit, dpi)

  let zpl = '^XA\n'
  zpl += `^PW${dotWidth}\n`
  zpl += `^LL${dotHeight}\n`

  for (const obj of objects) {
    if (!obj.visible) continue

    const x = convertToDots(obj.x, unit, dpi)
    const y = convertToDots(obj.y, unit, dpi)

    switch (obj.type) {
      case 'text': {
        const t = obj as TextObject
        const fontName = mapFontToZPL(t.fontFamily)
        const orientation = obj.rotation !== 0 ? 'R' : 'N'
        const heightDots = convertToDots(t.fontSize, unit, dpi)
        const widthDots = Math.round(heightDots * 0.6)
        zpl += `^FO${x},${y}\n`
        zpl += `^A${fontName}${orientation},${heightDots},${widthDots}\n`
        if (t.bold) {
          zpl += `^WX1\n`
        }
        zpl += `^FD${t.value}^FS\n`
        break
      }
      case 'barcode': {
        const bc = obj as BarcodeObject
        const bcHeight = convertToDots(bc.barcodeHeight, unit, dpi)
        const moduleWidth = bc.moduleWidth || 2
        zpl += `^FO${x},${y}\n`
        zpl += `^BY${moduleWidth}\n`
        const barcodeType = mapBarcodeTypeToZPL(bc.barcodeType)
        if (barcodeType === 'Code128') {
          zpl += `^BC${obj.rotation !== 0 ? 'R' : 'N'},${bcHeight},${bc.showHumanReadable ? 'Y' : 'N'},${bc.showHumanReadable && bc.humanReadablePosition === 'bottom' ? 'Y' : 'N'},N\n`
        } else if (barcodeType === 'Code39') {
          zpl += `^B3${obj.rotation !== 0 ? 'R' : 'N'},${bcHeight},${bc.showHumanReadable ? 'Y' : 'N'},N,N\n`
        } else if (barcodeType === 'EAN13') {
          zpl += `^BE${obj.rotation !== 0 ? 'R' : 'N'},${bcHeight},${bc.showHumanReadable ? 'Y' : 'N'}\n`
        } else {
          zpl += `^BC${obj.rotation !== 0 ? 'R' : 'N'},${bcHeight},${bc.showHumanReadable ? 'Y' : 'N'},Y,N\n`
        }
        zpl += `^FD${bc.value}^FS\n`
        break
      }
      case 'qrcode': {
        const qr = obj as QRCodeObject
        const modelSize = 2
        const ecLevel = mapQRErrorLevelToZPL(qr.errorCorrectionLevel)
        const qrSize = Math.round(Math.min(obj.width, obj.height) / 10)
        const magnification = Math.max(qrSize, 2)
        zpl += `^FO${x},${y}\n`
        zpl += `^BQN,${modelSize},${magnification}\n`
        zpl += `^FD${ecLevel},${qr.value}^FS\n`
        break
      }
      case 'shape': {
        const s = obj as ShapeObject
        const sWidth = convertToDots(obj.width, unit, dpi)
        const sHeight = convertToDots(obj.height, unit, dpi)
        const borderW = convertToDots(s.borderWidth, unit, dpi)
        if (s.cornerRadius > 0) {
          const radius = convertToDots(s.cornerRadius, unit, dpi)
          zpl += `^FO${x},${y}\n`
          zpl += `^GB${sWidth},${sHeight},${borderW},${toZPLColor(s.fillColor)},${radius}^FS\n`
        } else {
          zpl += `^FO${x},${y}\n`
          zpl += `^GB${sWidth},${sHeight},${borderW},${toZPLColor(s.fillColor)}^FS\n`
        }
        break
      }
      case 'line': {
        const l = obj as LineObject
        const endX = convertToDots(obj.x + l.endX, unit, dpi)
        const endY = convertToDots(obj.y + l.endY, unit, dpi)
        const length = Math.abs(endX - x) || 1
        const thickness = convertToDots(l.lineThickness, unit, dpi) || 1
        if (l.endX !== 0) {
          zpl += `^FO${x},${y}\n`
          zpl += `^GB${length},1,${thickness},${toZPLColor(l.lineColor)}^FS\n`
        }
        if (l.endY !== 0) {
          zpl += `^FO${x},${y}\n`
          zpl += `^GB1,${Math.abs(endY - y) || 1},${thickness},${toZPLColor(l.lineColor)}^FS\n`
        }
        break
      }
      case 'image': {
        const img = obj as ImageObject
        const imgWidth = convertToDots(obj.width, unit, dpi)
        const imgHeight = convertToDots(obj.height, unit, dpi)
        zpl += `^FO${x},${y}\n`
        zpl += `^XG:${img.source || 'IMAGE'},1,1^FS\n`
        break
      }
      case 'datetime': {
        const dt = obj as DateTimeObject
        const dtFontName = 'A'
        const dtHeight = convertToDots(14, 'pt', dpi)
        zpl += `^FO${x},${y}\n`
        zpl += `^A${dtFontName}N,${dtHeight},${Math.round(dtHeight * 0.6)}\n`
        zpl += `^FD${new Date().toLocaleDateString()}^FS\n`
        break
      }
      case 'counter': {
        const c = obj as CounterObject
        const cFontName = 'A'
        const cHeight = convertToDots(14, 'pt', dpi)
        zpl += `^FO${x},${y}\n`
        zpl += `^A${cFontName}N,${cHeight},${Math.round(cHeight * 0.6)}\n`
        zpl += `^FD${c.prefix}${String(c.startValue).padStart(c.padding, '0')}${c.suffix}^FS\n`
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

function mapBarcodeTypeToZPL(barcodeType: string): string {
  const map: Record<string, string> = {
    'Code128': 'Code128',
    'Code39': 'Code39',
    'EAN13': 'EAN13',
    'EAN8': 'EAN8',
    'UPCA': 'UPCA',
    'QRCode': 'QRCode',
    'DataMatrix': 'DataMatrix',
    'PDF417': 'PDF417',
    'ITF14': 'ITF14',
  }
  return map[barcodeType] || 'Code128'
}

function mapQRErrorLevelToZPL(level: string): string {
  const map: Record<string, string> = {
    'L': 'L',
    'M': 'M',
    'Q': 'Q',
    'H': 'H',
  }
  return map[level] || 'M'
}

function toZPLColor(color: string): string {
  if (color === '#000000' || color === 'black' || color === '#000' || color === '#fff' || color === '#FFFFFF') {
    if (color === '#FFFFFF' || color === '#fff' || color === 'white') return 'W'
    return 'B'
  }
  return 'B'
}

export function renderToEPL(
  objects: LabelObject[],
  width: number,
  height: number
): string {
  return ''
}

export function renderToTSPL(
  objects: LabelObject[],
  width: number,
  height: number
): string {
  return ''
}