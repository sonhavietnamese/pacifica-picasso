'use client'

import { usePacificaPriceStream } from '@/hooks/use-pacifica-price-stream'
import { DrawLine, Liveline, useDrawLinesStore, type LivelinePoint } from '@/lib/linelive'
import { roundPriceDirection } from '@/lib/utils'
import { useTokenStore } from '@/stores/token'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TextMorph } from 'torph/react'
import { DotBackground } from '../ui/dot-background'
import { PriceArrowIndicator } from '../ui/price-arrow-indicator'

const MAX_POINTS = 4000

export function SectionChart() {
  const drawnLines = useDrawLinesStore((s) => s.lines)
  const addLine = useDrawLinesStore((s) => s.addLine)
  const setCrossCount = useDrawLinesStore((s) => s.setCrossCount)

  const [data, setData] = useState<LivelinePoint[]>([])
  const [value, setValue] = useState(0)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up')
  const lastDirectionBucketRef = useRef<number | null>(null)

  const { token } = useTokenStore()

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

  usePacificaPriceStream(token.symbol, onPriceUpdate)

  const hasData = data.length > 0 && value > 0

  useEffect(() => {
    if (!hasData) {
      document.title = `Picasso | ${token.symbol}`
      return
    }
    const arrow = priceDirection === 'up' ? '↑' : '↓'
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    document.title = `Picasso | ${token.symbol} ${arrow} ${formatted}`
  }, [hasData, token.symbol, value, priceDirection])

  useEffect(() => {
    return () => {
      document.title = 'Picasso'
    }
  }, [])

  return (
    <section className="rounded-xl relative overflow-hidden bg-[linear-gradient(180deg,#11131E_19%,#56507D_100%)] p-3 w-full h-full">
      <div
        className="pointer-events-none absolute inset-0 z-10 h-full w-full shadow-[inset_0_-130px_80px_-30px_#c300ea]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 z-11 h-full w-full shadow-[inset_0_-70px_50px_-8px_rgba(131,68,214,0.5)]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 z-12 h-full w-full shadow-[inset_0_6px_15px_-2px_rgba(147,26,223,0.2)]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 z-13 h-full w-full mix-blend-plus-lighter shadow-[inset_0_-48px_50px_-20px_rgba(255,255,255,0.5)]"
        aria-hidden
      />

      <DotBackground />
      <div className="flex flex-col w-fit h-full relative">
        <div className="flex justify-between flex-col z-20">
          <div className="font-druk text-xl text-white z-1 flex items-center gap-1">
            <TextMorph className="">{token.symbol}</TextMorph>
            /USD
          </div>

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
          color={token.color}
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
          window={120}
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
