'use client'

import { type PacificaPosition, positionSideToOrderSide } from '@/hooks/use-pacifica-positions'
import { DrawLine } from '@/lib/linelive'
import { LineCard } from '../line-card'
import { CardSketch } from '../ui/card-sketch'

interface SectionLivePositionProps {
  address: string
  positions: PacificaPosition[]
  drawLines: DrawLine[]
}

export default function SectionLivePosition({ address, positions, drawLines }: SectionLivePositionProps) {
  if (!address) return null

  return (
    <ul className="w-full h-full rounded-xl space-y-2">
      {positions.length === 0 ? <p className="text-white/50">No draw yet</p> : null}
      {positions.length > 0
        ? positions.map((p) => (
            <CardSketch
              key={`${p.symbol}-${p.side}`}
              state="active"
              symbol={p.symbol}
              side={positionSideToOrderSide(p.side)}
              entryPrice={p.entry_price}
              amount={p.amount}
              pnlLabel={null}
            />
          ))
        : null}

      {drawLines.map((line) => (
        <LineCard key={line.points[0].time} line={line} />
      ))}
    </ul>
  )
}
