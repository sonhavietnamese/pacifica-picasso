'use client'

import { type PacificaPosition, positionSideToOrderSide } from '@/hooks/use-pacifica-positions'
import { CardSketch } from '../ui/card-sketch'
import { LivePosition } from '@/hooks/use-sketchbook'

interface SectionLivePositionProps {
  positions: LivePosition[]
}

export default function SectionLivePosition({ positions }: SectionLivePositionProps) {
  return (
    <ul className="w-full h-full rounded-xl space-y-2">
      {positions.length === 0 ? <p className="text-white/50">No draw yet</p> : null}
      {positions.length > 0 ? positions.map((p, index) => <CardSketch key={index} points={p.line.points} />) : null}
    </ul>
  )
}
