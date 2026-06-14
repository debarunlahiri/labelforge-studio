import React from 'react'
import { Group, Line, Text } from 'react-konva'
import type { LabelObject } from '../types'

interface RulerProps {
  size: number
  zoom: number
  unit: string
  offset: number
  dpi: number
  direction: 'horizontal' | 'vertical'
}

const RULER_THICKNESS = 24
const MAJOR_TICK_LENGTH = 14
const MINOR_TICK_LENGTH = 8
const MICRO_TICK_LENGTH = 4

function unitToCanvasPx(unit: string, dpi: number): number {
  switch (unit) {
    case 'cm':
      return 37.8 * (dpi / 300)
    case 'in':
      return 96 * (dpi / 300)
    case 'px':
      return 1
    case 'mm':
    default:
      return 3.78 * (dpi / 300)
  }
}

function pickMajorInterval(pxPerUnit: number, zoom: number): number {
  const intervals = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]
  return intervals.find((interval) => interval * pxPerUnit * zoom >= 56) || 500
}

function formatTick(value: number, interval: number): string {
  if (interval < 1) return value.toFixed(1).replace(/\.0$/, '')
  return String(Math.round(value))
}

export default function Ruler({ size, zoom, unit, offset, dpi, direction }: RulerProps) {
  const isHorizontal = direction === 'horizontal'
  const ticks: React.ReactNode[] = []
  const pxPerUnit = unitToCanvasPx(unit, dpi)
  const majorInterval = pickMajorInterval(pxPerUnit, zoom)
  const minorInterval = majorInterval / 5

  const startValue = offset / (pxPerUnit * zoom)
  const endValue = (offset + size) / (pxPerUnit * zoom)
  const firstTick = Math.floor(startValue / minorInterval) * minorInterval

  for (let value = firstTick; value <= endValue + minorInterval; value += minorInterval) {
    const roundedValue = Number(value.toFixed(4))
    const pos = roundedValue * pxPerUnit * zoom - offset
    if (pos < -1 || pos > size + 1) continue

    const majorIndex = Math.round(roundedValue / majorInterval)
    const isMajor = Math.abs(roundedValue - majorIndex * majorInterval) < minorInterval / 10
    const isHalf = !isMajor && Math.abs((roundedValue / majorInterval) % 0.5) < minorInterval / majorInterval / 10
    const tickLength = isMajor ? MAJOR_TICK_LENGTH : isHalf ? MINOR_TICK_LENGTH : MICRO_TICK_LENGTH

    if (isHorizontal) {
      ticks.push(
        <Line
          key={`t-${roundedValue}`}
          points={[pos, RULER_THICKNESS - tickLength, pos, RULER_THICKNESS]}
          stroke={isMajor ? '#64748b' : '#94a3b8'}
          strokeWidth={1}
        />
      )
      if (isMajor) {
        ticks.push(
          <Text
            key={`l-${roundedValue}`}
            x={pos + 2}
            y={2}
            text={formatTick(roundedValue, majorInterval)}
            fontSize={9}
            fill="#475569"
          />
        )
      }
    } else {
      ticks.push(
        <Line
          key={`t-${roundedValue}`}
          points={[RULER_THICKNESS - tickLength, pos, RULER_THICKNESS, pos]}
          stroke={isMajor ? '#64748b' : '#94a3b8'}
          strokeWidth={1}
        />
      )
      if (isMajor) {
        ticks.push(
          <Text
            key={`l-${roundedValue}`}
            x={2}
            y={pos + 2}
            text={formatTick(roundedValue, majorInterval)}
            fontSize={9}
            fill="#475569"
          />
        )
      }
    }
  }

  return <Group>{ticks}</Group>
}
