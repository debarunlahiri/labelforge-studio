import type { TextObject, TextStyleRun } from '../types'

export type TextStyle = Pick<TextObject, 'fontFamily' | 'fontSize' | 'bold' | 'italic' | 'underline' | 'textColor'>

export function styleAt(object: TextObject, index: number): TextStyle {
  const run = object.styleRuns?.find((item) => index >= item.start && index < item.end)
  return {
    fontFamily: run?.fontFamily ?? object.fontFamily,
    fontSize: run?.fontSize ?? object.fontSize,
    bold: run?.bold ?? object.bold,
    italic: run?.italic ?? object.italic,
    underline: run?.underline ?? object.underline,
    textColor: run?.textColor ?? object.textColor,
  }
}

export function applyStyleRange(
  object: TextObject,
  start: number,
  end: number,
  updates: Partial<TextStyle>,
): TextStyleRun[] {
  if (start >= end) return object.styleRuns || []
  const boundaries = new Set<number>([0, object.value.length, start, end])
  object.styleRuns?.forEach((run) => {
    boundaries.add(run.start)
    boundaries.add(run.end)
  })
  const points = [...boundaries].filter((point) => point >= 0 && point <= object.value.length).sort((a, b) => a - b)
  const runs: TextStyleRun[] = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const segmentStart = points[index]
    const segmentEnd = points[index + 1]
    if (segmentStart === segmentEnd) continue
    const existing = styleAt(object, segmentStart)
    const style = segmentStart < end && segmentEnd > start ? { ...existing, ...updates } : existing
    const base: TextStyle = {
      fontFamily: object.fontFamily, fontSize: object.fontSize, bold: object.bold,
      italic: object.italic, underline: object.underline, textColor: object.textColor,
    }
    const run: TextStyleRun = { start: segmentStart, end: segmentEnd }
    ;(Object.keys(style) as (keyof TextStyle)[]).forEach((key) => {
      if (style[key] !== base[key]) (run as any)[key] = style[key]
    })
    if (Object.keys(run).length > 2) runs.push(run)
  }
  return runs
}

export function shiftRunsForTextChange(runs: TextStyleRun[] = [], oldValue: string, newValue: string): TextStyleRun[] {
  if (oldValue === newValue) return runs
  const maxPrefix = Math.min(oldValue.length, newValue.length)
  let prefix = 0
  while (prefix < maxPrefix && oldValue[prefix] === newValue[prefix]) prefix += 1
  let oldSuffix = oldValue.length
  let newSuffix = newValue.length
  while (oldSuffix > prefix && newSuffix > prefix && oldValue[oldSuffix - 1] === newValue[newSuffix - 1]) {
    oldSuffix -= 1
    newSuffix -= 1
  }
  const delta = (newSuffix - prefix) - (oldSuffix - prefix)
  return runs.flatMap((run) => {
    if (run.end <= prefix) return [run]
    if (run.start >= oldSuffix) return [{ ...run, start: run.start + delta, end: run.end + delta }]
    return []
  }).filter((run) => run.start < run.end && run.end <= newValue.length)
}
