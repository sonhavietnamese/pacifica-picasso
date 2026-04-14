import { type PacificaOpenOrder } from '@/hooks/use-pacifica-open-orders'
import { formatPrice } from '@/lib/utils'

export type SectionOrdersProps = {
  orders: PacificaOpenOrder[]
  isLoading: boolean
  error: string | null
}

/** Renders open orders; fetch state must live in a parent that also owns `refetch` (single hook instance). */
export function SectionOrders({ orders }: SectionOrdersProps) {
  return (
    <ul className="w-full rounded-xl space-y-1.5 font-sans text-xs">
      {orders.map((o) => (
        <li key={o.order_id} className="flex justify-between gap-2 rounded-lg bg-[#1B1B1B] px-2 py-1.5 text-white/90">
          <span className="font-druk">{o.symbol}</span>
          <span className="tabular-nums text-white/70">
            {o.initial_amount} @ {Number.isFinite(Number(o.price)) ? formatPrice(Number(o.price)) : o.price}
          </span>
        </li>
      ))}
    </ul>
  )
}
