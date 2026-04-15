'use client'

import { usePacificaPriceStream } from '@/hooks/use-pacifica-price-stream'
import { DrawLine, Liveline, useDrawLinesStore, type LivelinePoint } from '@/lib/linelive'
import { roundPriceDirection } from '@/lib/utils'
import { useTokenStore } from '@/stores/token'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TextMorph } from 'torph/react'
import { DotBackground } from '../ui/dot-background'
import { PriceArrowIndicator } from '../ui/price-arrow-indicator'
import { v4 as uuidv4 } from 'uuid'
import { usePrivy } from '@privy-io/react-auth'

const MAX_POINTS = 4000

export function SectionChart() {
  const drawnLines = useDrawLinesStore((s) => s.lines)
  const addLine = useDrawLinesStore((s) => s.addLine)
  const setCrossCount = useDrawLinesStore((s) => s.setCrossCount)

  const { user } = usePrivy()

  const [data, setData] = useState<LivelinePoint[]>([])
  const [value, setValue] = useState(0)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up')
  const lastDirectionBucketRef = useRef<number | null>(null)
  /** Latest trade price for `/api/pool` (SL stop vs mark). */
  const lastPriceRef = useRef(0)

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
    lastPriceRef.current = rawPrice
  }, [])

  const handleDrawEnd = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    async (line: DrawLine) => {
      addLine({ ...line, id: uuidv4() })

      if (!user?.wallet?.id) return
      const startVal = line.points[0].value
      const endVal = line.points[line.points.length - 1].value
      /** Stroke direction (first → last), not `max − min` on the polyline (wobble can move extrema). */
      const direction = endVal - startVal

      if (direction === 0) return

      const isLong = direction > 0
      /** LONG → open with bid; SHORT (falling line) → open with ask. */
      const side = isLong ? 'bid' : 'ask'
      /**
       * Single sweep: rising line starts low / ends high → TP at end, SL at start.
       * Falling line starts high / ends low → TP at end (low), SL at start (high).
       */
      const tp = endVal
      const sl = startVal
      const entryPrice = line.points[Math.floor(line.points.length / 2)].value

      const amount = '0.2'
      console.log(side, tp.toFixed(2), sl.toFixed(2), entryPrice.toFixed(2), amount)

      const order = await fetch('/api/pool', {
        method: 'POST',
        body: JSON.stringify({
          walletId: user.wallet.id,
          symbol: token.symbol,
          side,
          tp: tp,
          sl: sl,
          entry: entryPrice,
          amount: '0.2',
          markPrice: lastPriceRef.current,
        }),
      })
      const data = await order.json()
      console.log(data)
    },
    [addLine, user?.wallet?.id, token.symbol]
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
          draw={{ enabled: true, stroke: '#14F195', strokeWidth: 20 }}
          drawLines={drawnLines}
          onDrawEnd={handleDrawEnd}
          onCrossing={setCrossCount}
          formatValue={(v) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}
        />
      </div>
    </section>
  )
}
