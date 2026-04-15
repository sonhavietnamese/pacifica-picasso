'use client'

import { HistoryPosition } from '@/hooks/use-sketchbook'
import { cn, formatPrice, formatTradePnl } from '@/lib/utils'

interface SectionHistoryProps {
  positions: HistoryPosition[]
}

export default function SectionHistory({ positions }: SectionHistoryProps) {
  return (
    <div className="w-full space-y-2">
      <ul className="w-full rounded-xl space-y-1.5 font-sans text-xs">
        {positions.length === 0 ? (
          <li className="text-white/50">No trades yet.</li>
        ) : (
          positions.map((t) => {
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
    </div>
  )
}
