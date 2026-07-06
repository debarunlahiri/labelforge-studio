import type { DateTimeObject, CounterObject } from '../types'

export type OffsetUnit = 'days' | 'months' | 'years'

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0')
}

export function applyDateOffset(date: Date, offset: number, offsetUnit: OffsetUnit): Date {
  const result = new Date(date)
  switch (offsetUnit) {
    case 'days':
      result.setDate(result.getDate() + offset)
      break
    case 'months':
      result.setMonth(result.getMonth() + offset)
      break
    case 'years':
      result.setFullYear(result.getFullYear() + offset)
      break
  }
  return result
}

export function hasTimeFormat(format: string): boolean {
  return /\b(H|HH|h|hh|m|mm|s|ss|a)\b/.test(format)
}

function parseBaseDateTime(obj: DateTimeObject, fallbackDate = new Date()): Date {
  if (obj.baseDate) {
    const time = obj.baseTime || '00:00'
    const [hours, minutes] = time.split(':').map(Number)
    const date = new Date(obj.baseDate + 'T00:00:00')
    if (Number.isFinite(hours)) date.setHours(hours)
    if (Number.isFinite(minutes)) date.setMinutes(minutes)
    return date
  }
  return fallbackDate
}

export function formatDateTimeObject(obj: DateTimeObject, fallbackDate = new Date()): string {
  const reference = parseBaseDateTime(obj, fallbackDate)
  const date = applyDateOffset(reference, obj.offset ?? 0, obj.offsetUnit ?? 'days')
  return formatDateTime(obj.format || 'dd/MM/yyyy', date)
}

export function formatDateTime(format: string, date: Date): string {
  const tokens: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    yy: String(date.getFullYear()).slice(-2),
    MM: pad(date.getMonth() + 1, 2),
    M: String(date.getMonth() + 1),
    dd: pad(date.getDate(), 2),
    d: String(date.getDate()),
    HH: pad(date.getHours(), 2),
    H: String(date.getHours()),
    hh: pad(date.getHours() % 12 || 12, 2),
    h: String(date.getHours() % 12 || 12),
    mm: pad(date.getMinutes(), 2),
    m: String(date.getMinutes()),
    ss: pad(date.getSeconds(), 2),
    s: String(date.getSeconds()),
    a: date.getHours() < 12 ? 'AM' : 'PM',
    SSS: pad(date.getMilliseconds(), 3),
  }

  const pattern = new RegExp(Object.keys(tokens).sort((a, b) => b.length - a.length).join('|'), 'g')
  return format.replace(pattern, (match) => tokens[match] ?? match)
}

export function formatCounter(obj: CounterObject, currentValue?: number): string {
  const value = currentValue ?? obj.startValue ?? 1
  const padded = String(value).padStart(Math.max(0, obj.padding ?? 0), '0')
  return `${obj.prefix ?? ''}${padded}${obj.suffix ?? ''}`
}
