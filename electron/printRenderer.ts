function toDots(value: number, unit: string, dpi = 300): number {
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

function zplText(value: string): string {
  return String(value || '').replace(/\^/g, ' ').replace(/~/g, ' ')
}

export function renderRawLabel(template: any, objects: any[], language: string): string {
  if (language === 'tspl') return renderTSPL(template, objects)
  return renderZPL(template, objects)
}

function renderZPL(template: any, objects: any[]): string {
  const unit = template.unit || 'mm'
  const dpi = Number(template.dpi || 300)
  let zpl = '^XA\n'
  zpl += `^PW${toDots(template.label_width, unit, dpi)}\n`
  zpl += `^LL${toDots(template.label_height, unit, dpi)}\n`

  for (const obj of objects) {
    if (!obj.visible) continue
    const x = toDots(obj.x, unit, dpi)
    const y = toDots(obj.y, unit, dpi)
    if (obj.type === 'text') {
      const size = Math.max(12, toDots(obj.fontSize || 12, 'pt', dpi))
      zpl += `^FO${x},${y}\n^A0N,${size},${Math.round(size * 0.6)}\n^FD${zplText(obj.value)}^FS\n`
    } else if (obj.type === 'barcode') {
      const height = Math.max(30, toDots(obj.barcodeHeight || obj.height || 20, unit, dpi))
      zpl += `^FO${x},${y}\n^BY${obj.moduleWidth || 2}\n^BCN,${height},${obj.showHumanReadable ? 'Y' : 'N'},Y,N\n^FD${zplText(obj.value)}^FS\n`
    } else if (obj.type === 'qrcode') {
      zpl += `^FO${x},${y}\n^BQN,2,${Math.max(2, Math.round(Math.min(obj.width, obj.height) / 10))}\n^FDM,${zplText(obj.value)}^FS\n`
    } else if (obj.type === 'shape') {
      zpl += `^FO${x},${y}\n^GB${toDots(obj.width, unit, dpi)},${toDots(obj.height, unit, dpi)},${Math.max(1, toDots(obj.borderWidth || 1, unit, dpi))},B^FS\n`
    } else if (obj.type === 'line') {
      zpl += `^FO${x},${y}\n^GB${Math.max(1, toDots(Math.abs(obj.endX || obj.width || 1), unit, dpi))},1,${Math.max(1, toDots(obj.lineThickness || 1, unit, dpi))},B^FS\n`
    }
  }

  zpl += '^XZ\n'
  return zpl
}

function renderTSPL(template: any, objects: any[]): string {
  const unit = template.unit || 'mm'
  const dpi = Number(template.dpi || 300)
  const widthMm = unit === 'mm' ? template.label_width : toDots(template.label_width, unit, dpi) * 25.4 / dpi
  const heightMm = unit === 'mm' ? template.label_height : toDots(template.label_height, unit, dpi) * 25.4 / dpi
  let tspl = `SIZE ${widthMm.toFixed(1)} mm, ${heightMm.toFixed(1)} mm\nGAP 2 mm, 0 mm\nDIRECTION 1\nCLS\n`

  for (const obj of objects) {
    if (!obj.visible) continue
    const x = toDots(obj.x, unit, dpi)
    const y = toDots(obj.y, unit, dpi)
    if (obj.type === 'text') {
      tspl += `TEXT ${x},${y},"0",0,1,1,"${String(obj.value || '').replace(/"/g, "'")}"\n`
    } else if (obj.type === 'barcode') {
      tspl += `BARCODE ${x},${y},"128",${Math.max(40, toDots(obj.barcodeHeight || obj.height || 20, unit, dpi))},${obj.showHumanReadable ? 1 : 0},0,2,2,"${String(obj.value || '').replace(/"/g, "'")}"\n`
    } else if (obj.type === 'qrcode') {
      tspl += `QRCODE ${x},${y},M,${Math.max(3, Math.round(Math.min(obj.width, obj.height) / 20))},A,0,"${String(obj.value || '').replace(/"/g, "'")}"\n`
    } else if (obj.type === 'shape') {
      tspl += `BOX ${x},${y},${x + toDots(obj.width, unit, dpi)},${y + toDots(obj.height, unit, dpi)},${Math.max(1, toDots(obj.borderWidth || 1, unit, dpi))}\n`
    }
  }

  tspl += 'PRINT 1\n'
  return tspl
}
