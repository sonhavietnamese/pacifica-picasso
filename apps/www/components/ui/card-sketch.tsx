'use client'

import { cn, formatPrice, formatUsdRough } from '@/lib/utils'
import { usePrivy } from '@privy-io/react-auth'
import type { OrderSide } from 'pacifica.js'
import { StrokePreview } from './stroke-review'
import { DrawLinePoint } from '@/lib/linelive'
import { useCallback, useMemo } from 'react'
import { usePacificaPriceStream } from '@/hooks/use-pacifica-price-stream'

type State = 'pending' | 'active'
type Bias = 'LONG' | 'SHORT' | 'NEUTRAL'

export interface CardSketchProps {
  state?: State
  /** e.g. BTC */
  symbol?: string
  side?: OrderSide
  entryPrice?: string
  amount?: string
  takeProfit?: string | null
  stopLoss?: string | null
  /** Last fill PnL label, e.g. "+$1.23" */
  pnlLabel?: string | null
  leverageLabel?: string
  points: DrawLinePoint[]
}

const CHECKPOINT_COUNT = 6

export function CardSketch({
  state = 'pending',
  symbol,
  side,
  entryPrice,
  amount,
  takeProfit,
  stopLoss,
  pnlLabel,
  points,
}: CardSketchProps) {
  const { user } = usePrivy()
  const title = symbol ?? '—'
  const entryDisplay = state === 'pending' ? 'Waiting' : formatUsdRough(entryPrice)
  const tpDisplay = takeProfit != null && takeProfit !== '' ? formatUsdRough(takeProfit) : '—'
  const slDisplay = stopLoss != null && stopLoss !== '' ? formatUsdRough(stopLoss) : '—'
  const pnlDisplay = pnlLabel ?? (state === 'pending' ? '$0' : '—')
  const pnlNegative = pnlDisplay.startsWith('-')
  const pnlNeutral = pnlDisplay === '—' || pnlDisplay === '$0'

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

  const onPriceUpdate = useCallback((price: number) => {
    console.log(price)
    console.log(Math.round(Date.now() / 1000))
  }, [])

  usePacificaPriceStream('SOL', onPriceUpdate)

  const normalizedTimeLine = useMemo(() => {
    return points.map((point) => {
      return {
        ...point,
        time: Math.round(point.time),
      }
    })
  }, [points])

  const bias = useMemo(() => {
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]

    const bias = lastPoint.value - firstPoint.value
    return bias > 0 ? 'LONG' : bias < -0 ? 'SHORT' : 'NEUTRAL'
  }, [points])

  const lowestPoint = useMemo(() => {
    return Math.min(...points.map((point) => point.value))
  }, [points])

  const highestPoint = useMemo(() => {
    return Math.max(...points.map((point) => point.value))
  }, [points])

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

  console.log(relativeTimeCheckpoints)

  return (
    <li
      className={cn(
        'w-full bg-[#1B1B1B] p-2 rounded-xl relative cursor-pointer group',
        state === 'pending' ? 'opacity-60' : 'opacity-100'
      )}
    >
      {state != 'pending' && (
        <aside className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={closePosition}
            className="bg-[#1B1B1B] rounded-lg p-1 px-1.5 border border-white/5 opacity-80 hover:opacity-100 transition-opacity duration-150"
          >
            <span className="leading-none text-white/80 text-sm font-medium ">Close</span>
          </button>
        </aside>
      )}

      <aside className="absolute bottom-2 right-2 pr-1" id="pnl">
        <span
          className={cn(
            'text-sm font-druk leading-none',
            state === 'pending' && 'text-white/50',
            state !== 'pending' && pnlNegative && 'text-rose-400',
            state !== 'pending' && !pnlNegative && !pnlNeutral && 'text-emerald-400/90',
            state !== 'pending' && pnlNeutral && 'text-white/80'
          )}
        >
          {pnlDisplay}
        </span>
      </aside>

      <div className="relative z-1 flex">
        {/* <aside className="absolute -top-1 -right-1 bg-black rounded-lg p-2 px-2.5">
          <span className="leading-none font-druk text-white text-sm">X3</span>
        </aside> */}

        {/* <aside className="absolute top-0 right-0 bg-black rounded-lg p-2 px-2.5">
          <span className="leading-none text-white text-sm font-medium">Patient</span>
        </aside> */}

        <div className="w-[90px] h-[80px] p-2 rounded flex items-center justify-center bg-[#1E1E1E]">
          <figure className="w-full h-full aspect-square overflow-hidden">
            <StrokePreview points={points} stroke="white" strokeWidth={8} />
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
