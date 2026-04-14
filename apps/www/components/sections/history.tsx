'use client'

import { usePacificaTradeHistory } from '@/hooks/use-pacifica-trade-history'
import { cn, formatPrice, formatTradePnl } from '@/lib/utils'

export default function SectionHistory({ address }: { address: string | undefined }) {
  const {
    data,
    isPending,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePacificaTradeHistory(address, { limit: 50 })

  const rows = data?.pages.flatMap((p) => p.data) ?? []

  if (!address) {
    return (
      <ul className="w-full rounded-xl space-y-1.5 font-sans text-xs">
        <li className="text-white/50">Connect a wallet to see fills.</li>
      </ul>
    )
  }

  if (error) {
    return <p className="text-sm text-red-400/90">{error.message}</p>
  }

  if (isPending) {
    return <p className="text-xs text-white/40">Loading trade history…</p>
  }

  return (
    <div className="w-full space-y-2">
      <ul className="w-full rounded-xl space-y-1.5 font-sans text-xs">
        {rows.length === 0 ? (
          <li className="text-white/50">No trades yet.</li>
        ) : (
          rows.map((t) => {
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
      {hasNextPage ? (
        <button
          type="button"
          onClick={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full rounded-lg bg-[#262626] py-2 text-xs font-medium text-white/80 hover:bg-[#2f2f2f] disabled:opacity-50"
        >
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      ) : null}
    </div>
  )
}
