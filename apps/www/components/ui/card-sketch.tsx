'use client'

import { cn, formatPrice, formatUsdRough } from '@/lib/utils'
import { usePrivy } from '@privy-io/react-auth'
import type { OrderSide } from 'pacifica.js'
import { StrokePreview } from './stroke-review'
import { useEffect, useMemo } from 'react'
import { LivePosition } from '@/hooks/use-sketchbook'
import NumberFlow from '@number-flow/react'
import { uuidv4 } from 'zod'

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

  // useEffect(() => {
  //   const handle = async () => {
  //     if (bias === 'NEUTRAL' || !user?.wallet?.id) return

  //     const lineId = drawLine.drawLine.id

  //     const tp = bias === 'LONG' ? highestPoint : lowestPoint
  //     const sl = bias === 'LONG' ? lowestPoint : highestPoint

  //     const entryPrice = drawLine.drawLine.points[Math.floor(drawLine.drawLine.points.length / 2)].value

  //     // create stop order for entry, tp, and sl
  //     const order = await fetch('/api/pool', {
  //       method: 'POST',
  //       body: JSON.stringify({
  //         walletId: user.wallet.id,
  //         symbol: 'SOL',
  //         side: side,
  //         tp: tp,
  //         sl: sl,
  //         lineId: lineId,
  //         entry: entryPrice,
  //         amount: '0.2',
  //         points: drawLine.drawLine.points.map((p) => ({ time: p.time, value: p.value })),
  //       }),
  //     })

  //     const data = await order.json()
  //     console.log(data)
  //   }

  //   handle()
  // }, [bias, user?.wallet?.id, drawLine.drawLine.id, drawLine.drawLine.points, highestPoint, lowestPoint, side])

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
