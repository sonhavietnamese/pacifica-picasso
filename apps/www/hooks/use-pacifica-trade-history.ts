'use client'

import { PACIFICA_API_ENDPOINTS } from '@/lib/constants'
import type { OrderSide } from 'pacifica.js'
import { useQuery } from '@tanstack/react-query'

/** Row from GET /api/v1/trades/history — Pacifica REST. */
export type PacificaTradeHistoryRow = {
  history_id: number
  order_id: number
  client_order_id: string
  symbol: string
  amount: string
  price: string
  entry_price: string
  fee: string
  pnl: string
  event_type: string
  side: string
  created_at: number
  cause: string
}

type PacificaTradesHistoryResponse = {
  success: boolean
  data: PacificaTradeHistoryRow[]
  error: string | null
  code: string | null
  last_order_id?: number
}

export function tradeHistorySideToOrderSide(side: string): OrderSide {
  if (side === 'bid' || side === 'ask') return side
  if (side.includes('long')) return 'bid'
  if (side.includes('short')) return 'ask'
  return 'bid'
}

async function fetchTradesHistory(account: string): Promise<PacificaTradeHistoryRow[]> {
  const response = await fetch(
    `${PACIFICA_API_ENDPOINTS.GET_TRADES_HISTORY}?account=${encodeURIComponent(account)}`
  )
  const raw = await response.text()
  let body: unknown
  try {
    body = JSON.parse(raw) as unknown
  } catch {
    throw new Error(raw || `Request failed (${response.status})`)
  }

  if (!response.ok) {
    const msg =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Request failed (${response.status})`
    throw new Error(msg)
  }

  const parsed = body as Partial<PacificaTradesHistoryResponse>
  if (!parsed.success || !Array.isArray(parsed.data)) {
    const apiError =
      typeof parsed.error === 'string' && parsed.error.length > 0 ? parsed.error : 'Unexpected response'
    throw new Error(apiError)
  }

  return parsed.data
}

export function usePacificaTradeHistory(account: string | null | undefined) {
  return useQuery({
    queryKey: ['pacifica', 'trades-history', account],
    queryFn: () => fetchTradesHistory(account!),
    enabled: Boolean(account),
    staleTime: 15_000,
  })
}
