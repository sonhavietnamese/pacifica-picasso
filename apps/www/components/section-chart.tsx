'use client'

import { usePacificaPriceStream } from '@/hooks/use-pacifica-price-stream'
import { DrawLine, Liveline, useDrawLinesStore, type LivelinePoint } from '@/lib/linelive'
import { useCallback, useRef, useState } from 'react'
import { DotBackground } from './ui/dot-background'
import { PriceArrowIndicator } from './ui/price-arrow-indicator'

const MAX_POINTS = 4000
const CHART_SYMBOL = 'HYPE'

/** Coarse bucket for arrow direction only — do not use this to drop live ticks. */
function roundPriceDirection(rawPrice: number): number {
  return Math.round(rawPrice * 10) / 10
}

export function SectionChart() {
  const drawnLines = useDrawLinesStore((s) => s.lines)
  const addLine = useDrawLinesStore((s) => s.addLine)
  const setCrossCount = useDrawLinesStore((s) => s.setCrossCount)

  const [data, setData] = useState<LivelinePoint[]>([])
  const [value, setValue] = useState(0)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up')
  const lastDirectionBucketRef = useRef<number | null>(null)

  const onPriceUpdate = useCallback((rawPrice: number) => {
    const bucket = roundPriceDirection(rawPrice)
    const prevBucket = lastDirectionBucketRef.current
    lastDirectionBucketRef.current = bucket
    if (prevBucket !== null) {
      if (bucket > prevBucket) setPriceDirection('up')
      else if (bucket < prevBucket) setPriceDirection('down')
    }

    const now = Date.now() / 1000
    const pt: LivelinePoint = { time: now, value: rawPrice }
    setData((prev) => {
      const next = [...prev, pt]
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next
    })
    setValue(rawPrice)
  }, [])

  const handleDrawEnd = useCallback(
    async (line: DrawLine) => {
      addLine(line)
    },
    [addLine]
  )

  usePacificaPriceStream(CHART_SYMBOL, onPriceUpdate)

  const hasData = data.length > 0 && value > 0

  return (
    <section className="bg-foreground rounded-xl relative overflow-hidden p-3 w-full h-full">
      <DotBackground />
      <div className="flex flex-col w-fit h-full relative">
        <div className="flex justify-between flex-col z-20">
          <h1 className="font-druk text-xl text-white z-1">{CHART_SYMBOL}/USD</h1>
          <div className="flex gap-2 items-center">
            {hasData && <PriceArrowIndicator direction={priceDirection} />}
            <span className="text-sm font-druk text-white/70">
              {value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full h-full absolute inset-0 z-10">
        <Liveline
          color="#F7931A"
          data={data}
          value={value}
          loading={!hasData}
          exaggerate={false}
          priceLine={{ direction: 'vertical' }}
          futureSpace={0.5}
          grid={false}
          badge={false}
          momentum
          scrub={false}
          window={30}
          draw={{ enabled: true, stroke: '#14F195', strokeWidth: 2 }}
          drawLines={drawnLines}
          onDrawEnd={handleDrawEnd}
          onCrossing={setCrossCount}
          formatValue={(v) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}
        />
      </div>
    </section>
  )
}
