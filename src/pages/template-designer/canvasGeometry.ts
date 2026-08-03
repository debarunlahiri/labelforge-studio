import type { LineObject } from '../../types'

export function getLineVisualHeight(line: LineObject): number {
  return Math.max(12, line.lineThickness || 1)
}

export function getLineNodePosition(line: LineObject) {
  return {
    x: line.x + line.width / 2,
    y: line.y + getLineVisualHeight(line) / 2,
  }
}
