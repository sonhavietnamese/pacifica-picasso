'use client'

import { cn, formatPrice, formatUsdRough } from '@/lib/utils'
import { usePrivy } from '@privy-io/react-auth'
import type { OrderSide } from 'pacifica.js'
import { StrokePreview } from './stroke-review'
import { useEffect, useMemo } from 'react'
import { LivePosition } from '@/hooks/use-sketchbook'
import NumberFlow from '@number-flow/react'

type State = 'pending' | 'active'
type Bias = 'LONG' | 'SHORT' | 'NEUTRAL'

export interface CardSketchProps {
  id: string
  state?: State
  symbol?: string
  side?: OrderSide
  entryPrice?: string
  amount?: string
  takeProfit?: string | null
  stopLoss?: string | null
  leverageLabel?: string
  drawLine: LivePosition
}

const CHECKPOINT_COUNT = 6

const poolInflight = new Set<string>()
const poolCompleted = new Set<string>()

export function CardSketch({ id, state = 'pending', symbol, side, entryPrice, amount, drawLine }: CardSketchProps) {
  const { user } = usePrivy()
  const entryDisplay = state === 'pending' ? 'Waiting' : formatUsdRough(entryPrice)

  const closePosition = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trade/orders/create_market', {
      method: 'POST',
      body: JSON.stringify({
        wallet_id: user.wallet.id,
        symbol: symbol,
        side: side === 'bid' ? 'ask' : 'bid',
        amount: amount,
      }),
    })

    const data = await response.json()
    console.log(data)
  }

  const normalizedTimeLine = useMemo(() => {
    return drawLine.drawLine.points.map((point) => {
      return {
        ...point,
        time: Math.round(point.time),
      }
    })
  }, [drawLine.drawLine.points])

  const bias = useMemo(() => {
    const firstPoint = drawLine.drawLine.points[0]
    const lastPoint = drawLine.drawLine.points[drawLine.drawLine.points.length - 1]

    const bias = lastPoint.value - firstPoint.value
    return bias > 0 ? 'LONG' : bias < -0 ? 'SHORT' : 'NEUTRAL'
  }, [drawLine.drawLine.points])

  const lowestPoint = useMemo(() => {
    return Math.min(...drawLine.drawLine.points.map((point) => point.value))
  }, [drawLine.drawLine.points])

  const highestPoint = useMemo(() => {
    return Math.max(...drawLine.drawLine.points.map((point) => point.value))
  }, [drawLine.drawLine.points])

  const relativeTimeCheckpoints = useMemo(() => {
    const earliestTime = Math.min(...normalizedTimeLine.map((point) => point.time))
    const latestTime = Math.max(...normalizedTimeLine.map((point) => point.time))

    const distance = Math.round((latestTime - earliestTime) / CHECKPOINT_COUNT)
    const timeCheckpoints = Array.from({ length: CHECKPOINT_COUNT }, (_, i) => earliestTime + distance * (i + 1))

    // remove the first and last timepoints
    const normalizedTimeCheckpoints = timeCheckpoints.slice(1, -1)

    // For each normalizedTimeCheckpoint, find the draw point with time closest to it
    const closestPoints = normalizedTimeCheckpoints.map((checkpoint) => {
      let minDist = Infinity
      let closest = null
      for (const point of normalizedTimeLine) {
        const dist = Math.abs(point.time - checkpoint)
        if (dist < minDist) {
          minDist = dist
          closest = point
        }
      }
      return closest
    })

    return closestPoints
  }, [normalizedTimeLine])

  useEffect(() => {
    if (bias === 'NEUTRAL' || !user?.wallet?.id) return

    const lineId = drawLine.drawLine.id
    if (poolCompleted.has(lineId) || poolInflight.has(lineId)) return

    const checkpoints: { index: number; time: number; value: number }[] = []
    relativeTimeCheckpoints.forEach((p, i) => {
      if (p) checkpoints.push({ index: i, time: p.time, value: p.value })
    })
    if (checkpoints.length === 0) return

    poolInflight.add(lineId)

    const tp = bias === 'LONG' ? highestPoint : lowestPoint
    const sl = bias === 'LONG' ? lowestPoint : highestPoint

    void fetch('/api/pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lineId,
        walletId: user.wallet.id,
        symbol: symbol ?? 'SOL',
        bias,
        checkpoints,
        tp,
        sl,
        amount: amount ?? '0.1',
        points: drawLine.drawLine.points.map((p) => ({ time: p.time, value: p.value })),
      }),
    })
      .then(async (res) => {
        const text = await res.text()
        try {
          const data = text ? (JSON.parse(text) as { success?: boolean }) : {}
          if (res.ok && data.success) poolCompleted.add(lineId)
        } catch {
          void 0
        }
      })
      .catch(() => {
        void 0
      })
      .finally(() => {
        poolInflight.delete(lineId)
      })
  }, [
    bias,
    user?.wallet?.id,
    drawLine.drawLine.id,
    drawLine.drawLine.points,
    relativeTimeCheckpoints,
    symbol,
    amount,
    highestPoint,
    lowestPoint,
  ])

  return (
    <li
      className={cn(
        'w-full bg-[#1B1B1B] p-2 rounded-xl relative cursor-pointer group',
        state === 'pending' ? 'opacity-60' : 'opacity-100'
      )}
    >
      <aside className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={closePosition}
          className="bg-[#1B1B1B] rounded-lg p-1 px-1.5 border border-white/5 opacity-80 hover:opacity-100 transition-opacity duration-150"
        >
          <span className="leading-none text-white/80 text-sm font-medium ">Close</span>
        </button>
      </aside>

      <aside className="absolute bottom-2 right-2 pr-1" id="pnl">
        <span className={cn('text-sm font-druk leading-none', state === 'pending' && 'text-white/50')}>
          <NumberFlow value={drawLine.crossCount} format={{ style: 'currency', currency: 'USD' }} />
        </span>
      </aside>

      <div className="relative z-1 flex">
        <aside className="absolute -top-1 -right-1 bg-black rounded-lg p-2 px-2.5">
          <span className="leading-none font-druk text-white text-sm">X{drawLine.crossCount ?? 0}</span>
        </aside>

        {/* <aside className="absolute top-0 right-0 bg-black rounded-lg p-2 px-2.5">
          <span className="leading-none text-white text-sm font-medium">Patient</span>
        </aside> */}

        <div className="w-[90px] h-[80px] p-2 rounded flex items-center justify-center bg-[#1E1E1E]">
          <figure className="w-full h-full aspect-square overflow-hidden">
            <StrokePreview points={drawLine.drawLine.points} stroke="white" strokeWidth={8} />
          </figure>
        </div>

        <div className="flex flex-col text-xs gap-1 justify-center font-medium ml-2">
          <div className="grid grid-cols-2 gap-x-2">
            <span className="text-white/70">Entry</span>
            <span className="text-white font-bold text-right tabular-nums">{entryDisplay}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-2">
            <span className="text-white/70">TP</span>
            <span className="text-white font-bold text-right tabular-nums">
              {bias === 'LONG' ? formatUsdRough(highestPoint.toString()) : formatUsdRough(lowestPoint.toString())}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-2">
            <span className="text-white/70">SL</span>
            <span className="text-white font-bold text-right tabular-nums">
              {bias === 'LONG' ? formatUsdRough(lowestPoint.toString()) : formatUsdRough(highestPoint.toString())}
            </span>
          </div>
        </div>
      </div>
    </li>
  )
}
