'use client'

import { CardSketch } from '@/components/ui/card-sketch'
import { usePacificaSketchbook } from '@/hooks/use-pacifica-sketchbook'
import { cn, formatPrice } from '@/lib/utils'
import { useSketchbook } from '@/stores/sketchbook'
import { usePrivy } from '@privy-io/react-auth'
import { useMemo } from 'react'

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

  const {
    positions,

    recentTrades,
    error,
    connectionStatus,
  } = usePacificaSketchbook(address)

  console.log(positions, recentTrades)

  const latestPnlBySymbol = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of recentTrades) {
      if (!m.has(t.symbol)) {
        m.set(t.symbol, formatTradePnl(t.pnl))
      }
    }
    return m
  }, [recentTrades])

  const createOrder = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trade/orders/create', {
      method: 'POST',
      body: JSON.stringify({ wallet_id: user.wallet.id }),
    })

    const data = await response.json()
    console.log(data)
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
        </div>
      </div>
      <div className="w-full h-full rounded-xl overflow-auto hide-scrollbar">
        {error ? <p className="mb-2 text-sm text-red-400/90">{error}</p> : null}
        {address && connectionStatus === 'connecting' && !error ? (
          <p className="mb-2 text-xs text-white/40">Syncing positions…</p>
        ) : null}

        {tab === 'live' ? (
          <ul className="w-full h-full rounded-xl space-y-2">
            {!address || positions.length === 0 ? <CardSketch state="pending" /> : null}
            {address && positions.length > 0
              ? positions.map((p) => (
                  <CardSketch
                    key={`${p.symbol}-${p.side}`}
                    state="active"
                    symbol={p.symbol}
                    side={p.side}
                    entryPrice={p.entry_price}
                    amount={p.amount}
                    pnlLabel={latestPnlBySymbol.get(p.symbol) ?? null}
                  />
                ))
              : null}
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
      </div>

      <button className="bg-yellow-500 text-white px-4 py-2 rounded-md" onClick={createOrder}>
        Create Order
      </button>
    </section>
  )
}
