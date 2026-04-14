'use client'

import { CardSketch } from '@/components/ui/card-sketch'
import { usePacificaOpenOrders } from '@/hooks/use-pacifica-open-orders'
import { usePacificaSketchbook } from '@/hooks/use-pacifica-sketchbook'
import { tradeHistorySideToOrderSide, usePacificaTradeHistory } from '@/hooks/use-pacifica-trade-history'
import { useDrawLinesStore } from '@/lib/linelive'
import { cn, formatPrice } from '@/lib/utils'
import { useSketchbook } from '@/stores/sketchbook'
import { usePrivy } from '@privy-io/react-auth'
import { LineCard } from '../line-card'
import { SectionOrders } from './orders'

function formatTradePnl(pnl: string): string {
  const n = Number.parseFloat(pnl)
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return '$0'
  const sign = n > 0 ? '+' : '-'
  return `${sign}$${formatPrice(Math.abs(n))}`
}

export function SectionSketchbook() {
  const tab = useSketchbook((state) => state.tab)
  const setTab = useSketchbook((state) => state.setTab)
  const { user } = usePrivy()
  const address = user?.wallet?.address

  const drawLines = useDrawLinesStore((state) => state.lines)

  const {
    orders,
    isLoading: isOrdersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = usePacificaOpenOrders(address)

  const { recentTrades, error, connectionStatus } = usePacificaSketchbook(address)

  const {
    data: tradeHistoryRows = [],
    isPending: isTradeHistoryPending,
    error: tradeHistoryError,
  } = usePacificaTradeHistory(address)

  const sketchbookError = error ?? tradeHistoryError?.message ?? null

  const createStopOrder = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trade/orders/stop/create', {
      method: 'POST',
      body: JSON.stringify({
        wallet_id: user.wallet.id,
        symbol: 'BTC',
        side: 'bid',
        reduce_only: false,

        stop_price: '80100',
        limit_price: '80100',
      }),
    })

    const data = await response.json()
    console.log(data)
    void refetchOrders()
  }

  const cancelStopOrder = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trade/orders/stop/cancel', {
      method: 'POST',
      body: JSON.stringify({
        wallet_id: user.wallet.id,
        order_id: orders[0].order_id,
      }),
    })

    const data = await response.json()
    console.log(data)
    void refetchOrders()
  }

  const cancelAllOrders = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trade/orders/cancel_all', {
      method: 'POST',
      body: JSON.stringify({
        wallet_id: user.wallet.id,
        all_symbols: true,
      }),
    })

    const data = await response.json()
    console.log(data)
    void refetchOrders()
  }

  return (
    <section className="pt-2 p-0 relative h-full flex flex-col">
      <div className="flex flex-col mb-2">
        <h2 className="font-druk text-base text-white ml-1">Your Sketchbook</h2>
        <div className="bg-[#262626] w-fit p-1 rounded-xl mt-2 font-medium">
          <button
            onClick={() => setTab('live')}
            className={cn(
              'text-white/70 px-2.5 p-2 bg-[#262626] rounded-lg',
              tab === 'live' && 'bg-[#171717] text-white'
            )}
          >
            Live
          </button>
          <button
            onClick={() => setTab('history')}
            className={cn(
              'text-white/70 px-2.5 p-2 rounded-lg bg-[#262626] ',
              tab === 'history' && 'bg-[#171717] text-white'
            )}
          >
            History
          </button>
          <button
            onClick={() => setTab('orders')}
            className={cn(
              'text-white/70 px-2.5 p-2 rounded-lg bg-[#262626] ',
              tab === 'orders' && 'bg-[#171717] text-white'
            )}
          >
            Orders
          </button>
        </div>
      </div>
      <div className="w-full h-full rounded-xl overflow-auto hide-scrollbar">
        {sketchbookError ? <p className="mb-2 text-sm text-red-400/90">{sketchbookError}</p> : null}
        {address && (isTradeHistoryPending || connectionStatus === 'connecting') && !sketchbookError ? (
          <p className="mb-2 text-xs text-white/40">Syncing sketchbook…</p>
        ) : null}

        {tab === 'live' ? (
          <ul className="w-full h-full rounded-xl space-y-2">
            {!address || tradeHistoryRows.length === 0 ? <CardSketch state="pending" /> : null}
            {address && tradeHistoryRows.length > 0
              ? tradeHistoryRows.map((p) => (
                  <CardSketch
                    key={p.history_id}
                    state="active"
                    symbol={p.symbol}
                    side={tradeHistorySideToOrderSide(p.side)}
                    entryPrice={p.entry_price}
                    amount={p.amount}
                    pnlLabel={formatTradePnl(p.pnl)}
                  />
                ))
              : null}

            {drawLines.map((line) => (
              <LineCard key={line.points[0].time} line={line} />
            ))}
          </ul>
        ) : (
          <ul className="w-full rounded-xl space-y-1.5 font-sans text-xs">
            {!address ? (
              <li className="text-white/50">Connect a wallet to see fills.</li>
            ) : recentTrades.length === 0 ? (
              <li className="text-white/50">No recent trades yet.</li>
            ) : (
              recentTrades.map((t) => {
                const px = Number.parseFloat(t.price)
                return (
                  <li
                    key={t.history_id}
                    className="flex justify-between gap-2 rounded-lg bg-[#1B1B1B] px-2 py-1.5 text-white/90"
                  >
                    <span className="font-druk">{t.symbol}</span>
                    <span className="tabular-nums text-white/70">
                      {t.amount} @ {Number.isFinite(px) ? formatPrice(px) : t.price}
                    </span>
                    <span
                      className={cn(
                        'font-druk tabular-nums',
                        Number.parseFloat(t.pnl) < 0 && 'text-rose-400',
                        Number.parseFloat(t.pnl) > 0 && 'text-emerald-400/90',
                        Number.parseFloat(t.pnl) === 0 && 'text-white/70'
                      )}
                    >
                      {formatTradePnl(t.pnl)}
                    </span>
                  </li>
                )
              })
            )}
          </ul>
        )}

        {tab === 'orders' ? <SectionOrders orders={orders} isLoading={isOrdersLoading} error={ordersError} /> : null}
      </div>

      <button className="bg-yellow-500 text-white px-4 py-2 rounded-md" onClick={createStopOrder}>
        Create Order
      </button>

      <button className="bg-yellow-500 text-white px-4 py-2 rounded-md" onClick={cancelAllOrders}>
        Cancel Order
      </button>
      <button className="bg-yellow-500 text-white px-4 py-2 rounded-md" onClick={cancelStopOrder}>
        Cancel Stop Order
      </button>
    </section>
  )
}
