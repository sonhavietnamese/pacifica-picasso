'use client'

import { Liveline, useDrawLinesStore, type LivelinePoint } from '@/lib/linelive'
import { SOLUSD_PRICE_FEED } from '@/lib/solana'
import { cn } from '@/lib/utils'
import { useCallback, useRef, useState } from 'react'
import { PriceArrowIndicator } from './price-arrow-indicator'

const MAX_POINTS = 4000
const EXPONENT_SCALE = Math.pow(10, SOLUSD_PRICE_FEED.exponent)
// const CROSSING_CHECK_INTERVAL = 2000

/** Compare ticks and momentum at 4 decimal places (USD) */
function roundPrice4(rawPrice: number): number {
  return Math.round(rawPrice * 10_000) / 10_000
}

export function SectionCanvas() {
  const drawnLines = useDrawLinesStore((s) => s.lines)
  const addLine = useDrawLinesStore((s) => s.addLine)
  const setCrossCount = useDrawLinesStore((s) => s.setCrossCount)

  const [data, setData] = useState<LivelinePoint[]>([])
  const [value, setValue] = useState(0)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up')
  const lastPrice4Ref = useRef<number | null>(null)

  const onPriceUpdate = useCallback((rawPrice: number) => {
    const price4 = roundPrice4(rawPrice)
    if (price4 === lastPrice4Ref.current) return

    const prev4 = lastPrice4Ref.current
    lastPrice4Ref.current = price4

    if (prev4 !== null) {
      if (price4 > prev4) setPriceDirection('up')
      else if (price4 < prev4) setPriceDirection('down')
    }

    const scaled = rawPrice * EXPONENT_SCALE
    const now = Date.now() / 1000
    const pt: LivelinePoint = { time: now, value: scaled }
    setData((prev) => {
      const next = [...prev, pt]
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next
    })
    setValue(scaled)
  }, [])

  const hasData = data.length > 0 && value > 0

  return (
    <section className="bg-foreground rounded-xl flex-1 flex relative overflow-hidden p-6">
      <div
        className={cn('absolute bg-[radial-gradient(#404040_1px,transparent_1px)] inset-0 z-0 bg-size-[28px_28px]')}
      />
      <div className="flex flex-col w-fit h-full relative">
        <div className="flex justify-between flex-col z-20">
          <h1 className="font-druk text-2xl text-white z-1">SOL/USD</h1>
          <div className="flex gap-2 items-center">
            {hasData && <PriceArrowIndicator direction={priceDirection} />}
            <span className="text-lg font-druk text-white/70">
              {value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full h-full absolute inset-0 z-10">
        <Liveline
          data={data}
          value={value}
          color="#9945FF"
          loading={!hasData}
          exaggerate
          priceLine={{ direction: 'vertical' }}
          futureSpace={0.4}
          valueMomentumColor
          grid={false}
          window={30}
          draw={{ enabled: true, stroke: '#14F195', strokeWidth: 2 }}
          drawLines={drawnLines}
          // onDrawEnd={handleDrawEnd}
          onCrossing={setCrossCount}
          formatValue={(v) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}
        />
      </div>
      {/* <aside className="absolute bottom-9 left-5">
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {isConnecting && 'Connecting to Solana...'}
          {isConnected && !hasData && 'Waiting for first price...'}
          {isConnected && hasData && `Live — ${data.length} ticks`}
          {error && `Error: ${error}`}
          {!isConnecting && !isConnected && !error && 'Disconnected'}
        </p>
      </aside>
      <Onboarding /> */}
    </section>
  )
}
