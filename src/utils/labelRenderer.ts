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
import { styleAt } from '../designer/richText'
import bwipjs from 'bwip-js'
import { getBwipSymbology, isQrFamilySymbology, symbologyByValue } from '../designer/symbologies'

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

function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!source) return resolve(null)
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = source
  })
}

function normalizeBwipColor(color?: string): string {
  return (color || '#000000').replace(/^#/, '') || '000000'
}

function getLineVisualHeight(line: LineObject): number {
  return Math.max(12, line.lineThickness || 1)
}

async function renderBarcodeImage(
  barcodeType: string,
  value: string,
  width: number,
  height: number,
  options: {
    barcodeHeight?: number
    moduleWidth?: number
    showHumanReadable?: boolean
    quietZone?: number
    foregroundColor?: string
    backgroundColor?: string
    errorCorrectionLevel?: string
  } = {}
): Promise<HTMLImageElement | null> {
  if (!value) return null
  const symbology = symbologyByValue[barcodeType]
  if (symbology?.supported === false) return null

  const render = async (bwipType: string) => {
    const barcodeCanvas = document.createElement('canvas')
    const bwipOptions: any = {
      bcid: bwipType,
      text: value,
      scale: 3,
      width,
      height: options.barcodeHeight || height,
      includetext: false,
      barcolor: normalizeBwipColor(options.foregroundColor),
      backgroundcolor: normalizeBwipColor(options.backgroundColor || '#FFFFFF'),
    }
    if (options.moduleWidth) bwipOptions.modulewidth = options.moduleWidth
    if (options.quietZone) bwipOptions.padding = options.quietZone
    if (bwipType === 'qrcode' && options.errorCorrectionLevel) {
      bwipOptions.eclevel = options.errorCorrectionLevel
    }
    bwipjs.toCanvas(barcodeCanvas, bwipOptions)
    return loadImage(barcodeCanvas.toDataURL('image/png'))
  }

  const bwipType = getBwipSymbology(barcodeType)
  try {
    return await render(bwipType)
  } catch {
    if (isQrFamilySymbology(barcodeType) && bwipType !== 'qrcode') {
      try {
        return await render('qrcode')
      } catch {
        return null
      }
    }
    return null
  }
}

export async function renderToCanvas(
  objects: LabelObject[],
  width: number,
  height: number,
  dpi: number,
  unit: string
): Promise<HTMLCanvasElement> {
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

  const loadedImages = new Map<string, HTMLImageElement | null>()
  await Promise.all(objects.filter((object) => object.type === 'image').map(async (object) => {
    const imageObject = object as ImageObject
    loadedImages.set(object.id, await loadImage(imageObject.source))
  }))
  const renderedBarcodes = new Map<string, HTMLImageElement | null>()
  await Promise.all(objects.filter((object) => object.type === 'barcode' || object.type === 'qrcode').map(async (object) => {
    if (object.type === 'barcode') {
      const barcode = object as BarcodeObject
      renderedBarcodes.set(object.id, await renderBarcodeImage(barcode.barcodeType, barcode.value, object.width, object.height, {
        barcodeHeight: barcode.barcodeHeight,
        moduleWidth: barcode.moduleWidth,
        showHumanReadable: barcode.showHumanReadable,
        quietZone: barcode.quietZone,
        foregroundColor: barcode.foregroundColor,
        backgroundColor: barcode.backgroundColor,
      }))
    } else {
      const qr = object as QRCodeObject
      renderedBarcodes.set(object.id, await renderBarcodeImage(qr.barcodeType || 'QRCode', qr.value, object.width, object.height, {
        quietZone: qr.quietZone,
        foregroundColor: qr.foregroundColor,
        backgroundColor: qr.backgroundColor,
        errorCorrectionLevel: qr.errorCorrectionLevel,
      }))
    }
  }))

  for (const obj of objects) {
    if (!obj.visible) continue
    ctx.save()
    if (obj.type === 'line') {
      const l = obj as LineObject
      const lineHeight = getLineVisualHeight(l)
      ctx.translate(obj.x + obj.width / 2, obj.y + lineHeight / 2)
      ctx.rotate((obj.rotation * Math.PI) / 180)
      ctx.globalAlpha = obj.opacity
      ctx.strokeStyle = l.lineColor
      ctx.lineWidth = l.lineThickness
      if (l.lineStyle === 'dashed') {
        ctx.setLineDash([8, 4])
      } else if (l.lineStyle === 'dotted') {
        ctx.setLineDash([2, 2])
      }
      ctx.beginPath()
      ctx.moveTo(-obj.width / 2, 0)
      ctx.lineTo(obj.width / 2, 0)
      ctx.stroke()
      ctx.restore()
      continue
    }
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
        const lines = t.value.split('\n')
        let textIndex = 0
        let y = 0
        for (const line of lines) {
          const chars = [...line]
          const widths = chars.map((char, index) => {
            const style = styleAt(t, textIndex + index)
            ctx.font = `${style.italic ? 'italic ' : ''}${style.bold ? 'bold ' : ''}${style.fontSize}px "${style.fontFamily}", sans-serif`
            return ctx.measureText(char).width + t.letterSpacing
          })
          const lineWidth = widths.reduce((sum, width) => sum + width, 0)
          let x = t.horizontalAlign === 'center' ? (obj.width - lineWidth) / 2 : t.horizontalAlign === 'right' ? obj.width - lineWidth : 0
          const maxSize = chars.reduce((size, _, index) => Math.max(size, styleAt(t, textIndex + index).fontSize), t.fontSize)
          const baseline = y + maxSize
          chars.forEach((char, index) => {
            const style = styleAt(t, textIndex + index)
            ctx.font = `${style.italic ? 'italic ' : ''}${style.bold ? 'bold ' : ''}${style.fontSize}px "${style.fontFamily}", sans-serif`
            ctx.fillStyle = style.textColor
            ctx.textAlign = 'left'
            ctx.textBaseline = 'alphabetic'
            ctx.fillText(char, x, baseline)
            if (style.underline) {
              ctx.beginPath()
              ctx.moveTo(x, baseline + 2)
              ctx.lineTo(x + widths[index] - t.letterSpacing, baseline + 2)
              ctx.strokeStyle = style.textColor
              ctx.stroke()
            }
            x += widths[index]
          })
          y += maxSize * t.lineHeight
          textIndex += line.length + 1
        }
        break
      }
      case 'barcode': {
        const bc = obj as BarcodeObject
        const foregroundColor = bc.foregroundColor || '#000000'
        const showHumanReadable = bc.showHumanReadable ?? false
        const humanReadableHeight = showHumanReadable ? 18 : 0
        const barcodeAreaHeight = Math.max(1, obj.height - humanReadableHeight)
        ctx.fillStyle = bc.backgroundColor
        ctx.fillRect(0, 0, obj.width, obj.height)
        const barcodeImage = renderedBarcodes.get(obj.id)
        if (barcodeImage) {
          ctx.drawImage(barcodeImage, 0, 0, obj.width, barcodeAreaHeight)
        }
        if (showHumanReadable) {
          ctx.fillStyle = foregroundColor
          ctx.font = '10px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(bc.value, obj.width / 2, barcodeAreaHeight + humanReadableHeight / 2)
        }
        break
      }
      case 'qrcode': {
        const qr = obj as QRCodeObject
        ctx.fillStyle = qr.backgroundColor
        ctx.fillRect(0, 0, obj.width, obj.height)
        const qrImage = renderedBarcodes.get(obj.id)
        if (qrImage) {
          ctx.drawImage(qrImage, 0, 0, obj.width, obj.height)
        }
        break
      }
      case 'shape': {
        const s = obj as ShapeObject
        ctx.fillStyle = s.fillColor
        ctx.strokeStyle = s.borderColor
        ctx.lineWidth = s.borderWidth
        if (s.shapeType === 'circle' || s.shapeType === 'ellipse') {
          ctx.beginPath()
          ctx.ellipse(obj.width / 2, obj.height / 2, s.shapeType === 'circle' ? Math.min(obj.width, obj.height) / 2 : obj.width / 2, s.shapeType === 'circle' ? Math.min(obj.width, obj.height) / 2 : obj.height / 2, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        } else if (s.shapeType === 'triangle' || s.shapeType === 'polygon') {
          const sides = s.shapeType === 'triangle' ? 3 : 6
          const radius = Math.min(obj.width, obj.height) / 2
          ctx.beginPath()
          for (let index = 0; index < sides; index += 1) {
            const angle = -Math.PI / 2 + index * Math.PI * 2 / sides
            const x = obj.width / 2 + Math.cos(angle) * radius
            const y = obj.height / 2 + Math.sin(angle) * radius
            if (index === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        } else if (s.shapeType === 'roundedRectangle' || s.cornerRadius > 0) {
          ctx.beginPath()
          ctx.roundRect(0, 0, obj.width, obj.height, s.shapeType === 'roundedRectangle' ? Math.max(s.cornerRadius, 12) : s.cornerRadius)
          ctx.fill()
          ctx.stroke()
        } else {
          ctx.fillRect(0, 0, obj.width, obj.height)
          ctx.strokeRect(0, 0, obj.width, obj.height)
        }
        break
      }
      case 'image': {
        const img = obj as ImageObject
        const loadedImage = loadedImages.get(obj.id)
        if (loadedImage) {
          let drawX = 0
          let drawY = 0
          let drawWidth = obj.width
          let drawHeight = obj.height
          let sourceX = 0
          let sourceY = 0
          let sourceWidth = loadedImage.naturalWidth
          let sourceHeight = loadedImage.naturalHeight
          if (img.fitMode === 'cover') {
            const targetRatio = obj.width / obj.height
            const sourceRatio = loadedImage.naturalWidth / loadedImage.naturalHeight
            if (sourceRatio > targetRatio) sourceWidth = loadedImage.naturalHeight * targetRatio
            else sourceHeight = loadedImage.naturalWidth / targetRatio
            sourceX = (loadedImage.naturalWidth - sourceWidth) * Math.max(0, Math.min(100, img.cropX ?? 50)) / 100
            sourceY = (loadedImage.naturalHeight - sourceHeight) * Math.max(0, Math.min(100, img.cropY ?? 50)) / 100
          } else if (img.fitMode !== 'stretch' && img.maintainAspectRatio) {
            const scale = Math.min(obj.width / loadedImage.naturalWidth, obj.height / loadedImage.naturalHeight)
            drawWidth = loadedImage.naturalWidth * scale
            drawHeight = loadedImage.naturalHeight * scale
            drawX = (obj.width - drawWidth) / 2
            drawY = (obj.height - drawHeight) / 2
          }
          ctx.save()
          ctx.translate(img.flipHorizontal ? obj.width : 0, img.flipVertical ? obj.height : 0)
          ctx.scale(img.flipHorizontal ? -1 : 1, img.flipVertical ? -1 : 1)
          ctx.drawImage(loadedImage, sourceX, sourceY, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight)
          ctx.restore()
        }
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
  const canvas = await renderToCanvas(objects, width, height, dpi, unit)
  return canvas.toDataURL('image/png')
}

export async function renderToJPEG(
  objects: LabelObject[],
  width: number,
  height: number,
  dpi: number,
  unit: string
): Promise<string> {
  const canvas = await renderToCanvas(objects, width, height, dpi, unit)
  return canvas.toDataURL('image/jpeg', 0.95)
}

export async function renderToPDF(
  objects: LabelObject[],
  width: number,
  height: number,
  dpi: number,
  unit: string,
  templateName: string
): Promise<Blob> {
  const canvas = await renderToCanvas(objects, width, height, dpi, unit)
  const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95)
  const imgData = imgDataUrl.split(',')[1]

  const widthInPt = unit === 'mm' ? width * 2.835 : unit === 'cm' ? width * 28.35 : unit === 'in' ? width * 72 : width * 0.75
  const heightInPt = unit === 'mm' ? height * 2.835 : unit === 'cm' ? height * 28.35 : unit === 'in' ? height * 72 : height * 0.75

  const pdfContent = buildSimplePDF(imgData, widthInPt, heightInPt, canvas.width, canvas.height)

  return Promise.resolve(new Blob([pdfContent.slice()], { type: 'application/pdf' }))
}

function buildSimplePDF(
  imageData: string,
  widthPt: number,
  heightPt: number,
  pixelWidth: number,
  pixelHeight: number
): Uint8Array {
  const encoder = new TextEncoder()
  const imgBytes = atob(imageData)
  const imgUint8 = new Uint8Array(imgBytes.length)
  for (let i = 0; i < imgBytes.length; i++) {
    imgUint8[i] = imgBytes.charCodeAt(i)
  }

  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let byteLength = 0

  const append = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk
    chunks.push(bytes)
    byteLength += bytes.length
  }
  const appendObject = (object: string | Uint8Array) => {
    offsets.push(byteLength)
    append(object)
  }

  append('%PDF-1.4\n')
  appendObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  appendObject('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')
  appendObject(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt.toFixed(2)} ${heightPt.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Img1 5 0 R >> >> >>\nendobj\n`)

  const contentStream = `q\n${widthPt.toFixed(2)} 0 0 ${heightPt.toFixed(2)} 0 0 cm\n/Img1 Do\nQ\n`
  appendObject(`4 0 obj\n<< /Length ${encoder.encode(contentStream).length} >>\nstream\n${contentStream}endstream\nendobj\n`)

  offsets.push(byteLength)
  append(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgUint8.length} >>\nstream\n`)
  append(imgUint8)
  append('\nendstream\nendobj\n')
  appendObject('6 0 obj\n<< /Producer (LabelForge Studio) >>\nendobj\n')

  const xrefOffset = byteLength
  append(`xref\n0 7\n0000000000 65535 f \n${offsets.map((offset) => `${offset.toString().padStart(10, '0')} 00000 n \n`).join('')}`)
  append(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)

  const pdfUint8 = new Uint8Array(byteLength)
  let offset = 0
  for (const chunk of chunks) {
    pdfUint8.set(chunk, offset)
    offset += chunk.length
  }
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
    if (color === '#FFFFFF' || color === '#fff') return 'W'
    return 'B'
  }
  return 'B'
}

export function renderToEPL(
  objects: LabelObject[],
  width: number,
  height: number
): string {
  const dpi = 203
  const dotWidth = convertToDots(width, 'mm', dpi)
  const dotHeight = convertToDots(height, 'mm', dpi)
  let epl = 'N\n'
  epl += `q${dotWidth}\n`
  epl += `Q${dotHeight},24\n`

  for (const obj of objects) {
    if (!obj.visible) continue
    const x = Math.round(obj.x)
    const y = Math.round(obj.y)

    switch (obj.type) {
      case 'text': {
        const text = (obj as TextObject).value.replace(/"/g, "'").replace(/\r?\n/g, ' ')
        epl += `A${x},${y},${rotationToEPL(obj.rotation)},4,1,1,N,"${text}"\n`
        break
      }
      case 'barcode': {
        const barcode = obj as BarcodeObject
        const humanReadable = barcode.showHumanReadable ? 'B' : 'N'
        const value = barcode.value.replace(/"/g, "'")
        epl += `B${x},${y},${rotationToEPL(obj.rotation)},1,${barcode.moduleWidth || 2},2,${Math.max(40, Math.round(barcode.barcodeHeight || obj.height))},${humanReadable},"${value}"\n`
        break
      }
      case 'qrcode': {
        const qr = obj as QRCodeObject
        epl += `b${x},${y},Q,s${Math.max(3, Math.round(Math.min(obj.width, obj.height) / 24))},"${qr.value.replace(/"/g, "'")}"\n`
        break
      }
      case 'shape': {
        const shape = obj as ShapeObject
        const lineWidth = Math.max(1, Math.round(shape.borderWidth || 1))
        epl += `X${x},${y},${lineWidth},${Math.round(obj.width)},${Math.round(obj.height)}\n`
        break
      }
      case 'line': {
        const line = obj as LineObject
        epl += `LO${x},${y},${Math.max(1, Math.round(Math.abs(line.endX || obj.width || 1)))},${Math.max(1, Math.round(line.lineThickness || 1))}\n`
        break
      }
    }
  }

  epl += 'P1\n'
  return epl
}

export function renderToTSPL(
  objects: LabelObject[],
  width: number,
  height: number
): string {
  let tspl = `SIZE ${width.toFixed(1)} mm, ${height.toFixed(1)} mm\nGAP 2 mm, 0 mm\nDIRECTION 1\nCLS\n`

  for (const obj of objects) {
    if (!obj.visible) continue
    const x = Math.round(obj.x)
    const y = Math.round(obj.y)

    switch (obj.type) {
      case 'text': {
        const text = (obj as TextObject).value.replace(/"/g, "'").replace(/\r?\n/g, ' ')
        tspl += `TEXT ${x},${y},"0",${rotationToDegrees(obj.rotation)},1,1,"${text}"\n`
        break
      }
      case 'barcode': {
        const barcode = obj as BarcodeObject
        const text = barcode.value.replace(/"/g, "'")
        tspl += `BARCODE ${x},${y},"128",${Math.max(40, Math.round(barcode.barcodeHeight || obj.height))},${barcode.showHumanReadable ? 1 : 0},${rotationToDegrees(obj.rotation)},${barcode.moduleWidth || 2},2,"${text}"\n`
        break
      }
      case 'qrcode': {
        const qr = obj as QRCodeObject
        const text = qr.value.replace(/"/g, "'")
        tspl += `QRCODE ${x},${y},M,${Math.max(3, Math.round(Math.min(obj.width, obj.height) / 20))},A,${rotationToDegrees(obj.rotation)},"${text}"\n`
        break
      }
      case 'shape': {
        const shape = obj as ShapeObject
        tspl += `BOX ${x},${y},${x + Math.round(obj.width)},${y + Math.round(obj.height)},${Math.max(1, Math.round(shape.borderWidth || 1))}\n`
        break
      }
      case 'line': {
        const line = obj as LineObject
        tspl += `BAR ${x},${y},${Math.max(1, Math.round(Math.abs(line.endX || obj.width || 1)))},${Math.max(1, Math.round(line.lineThickness || 1))}\n`
        break
      }
    }
  }

  tspl += 'PRINT 1\n'
  return tspl
}

function rotationToDegrees(rotation: number): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360
  return (normalized === 90 || normalized === 180 || normalized === 270 ? normalized : 0) as 0 | 90 | 180 | 270
}

function rotationToEPL(rotation: number): 0 | 1 | 2 | 3 {
  const degrees = rotationToDegrees(rotation)
  if (degrees === 90) return 1
  if (degrees === 180) return 2
  if (degrees === 270) return 3
  return 0
}
