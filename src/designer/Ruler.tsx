import React from 'react'
import { Group, Line, Text } from 'react-konva'
import type { LabelObject } from '../types'

interface RulerProps {
  size: number
  zoom: number
  unit: string
  offset: number
  direction: 'horizontal' | 'vertical'
}

const RULER_THICKNESS = 24
const MAJOR_INTERVAL = 10
const MINOR_INTERVAL = 5
const MAJOR_TICK_LENGTH = 14
const MINOR_TICK_LENGTH = 8

export default function Ruler({ size, zoom, unit, offset, direction }: RulerProps) {
  const isHorizontal = direction === 'horizontal'
  const ticks: React.ReactNode[] = []

  const startValue = offset / zoom
  const endValue = (offset + size) / zoom
  const firstTick = Math.floor(startValue / MINOR_INTERVAL) * MINOR_INTERVAL

  for (let value = firstTick; value <= endValue + MINOR_INTERVAL; value += MINOR_INTERVAL) {
    const pos = value * zoom - offset
    if (pos < -1 || pos > size + 1) continue

    const isMajor = value % MAJOR_INTERVAL === 0
    const tickLength = isMajor ? MAJOR_TICK_LENGTH : MINOR_TICK_LENGTH

    if (isHorizontal) {
      ticks.push(
        <Line
          key={`t-${value}`}
          points={[pos, RULER_THICKNESS - tickLength, pos, RULER_THICKNESS]}
          stroke="#888"
          strokeWidth={1}
        />
      )
      if (isMajor) {
        ticks.push(
          <Text
            key={`l-${value}`}
            x={pos + 2}
            y={2}
            text={`${Math.round(value)}`}
            fontSize={9}
            fill="#555"
          />
        )
      }
    } else {
      ticks.push(
        <Line
          key={`t-${value}`}
          points={[RULER_THICKNESS - tickLength, pos, RULER_THICKNESS, pos]}
          stroke="#888"
          strokeWidth={1}
        />
      )
      if (isMajor) {
        ticks.push(
          <Text
            key={`l-${value}`}
            x={2}
            y={pos + 2}
            text={`${Math.round(value)}`}
            fontSize={9}
            fill="#555"
          />
        )
      }
    }
  }

  return <Group>{ticks}</Group>
}