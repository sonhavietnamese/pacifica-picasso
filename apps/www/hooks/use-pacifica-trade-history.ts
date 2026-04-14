'use client'

import { PACIFICA_API_ENDPOINTS } from '@/lib/constants'
import { useInfiniteQuery } from '@tanstack/react-query'

/**
 * One fill from GET /api/v1/trades/history.
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-trade-history
 */
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

export type PacificaTradeHistoryQueryParams = {
  symbol?: string
  start_time?: number
  end_time?: number
  /** Max rows per request; API default 100. */
  limit?: number
}

type PacificaTradeHistoryPageResponse = {
  success: boolean
  data: PacificaTradeHistoryRow[]
  next_cursor?: string | null
  has_more?: boolean
  error: string | null
  code: string | null
}

async function fetchTradeHistoryPage(
  account: string,
  cursor: string | undefined,
  params: PacificaTradeHistoryQueryParams | undefined
): Promise<{ data: PacificaTradeHistoryRow[]; next_cursor: string | null; has_more: boolean }> {
  const search = new URLSearchParams({ account })
  if (params?.symbol) search.set('symbol', params.symbol)
  if (params?.start_time != null) search.set('start_time', String(params.start_time))
  if (params?.end_time != null) search.set('end_time', String(params.end_time))
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (cursor) search.set('cursor', cursor)

  const response = await fetch(`${PACIFICA_API_ENDPOINTS.GET_TRADES_HISTORY}?${search.toString()}`)
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

  const parsed = body as Partial<PacificaTradeHistoryPageResponse>
  if (!parsed.success || !Array.isArray(parsed.data)) {
    const apiError =
      typeof parsed.error === 'string' && parsed.error.length > 0 ? parsed.error : 'Unexpected response'
    throw new Error(apiError)
  }

  return {
    data: parsed.data,
    next_cursor: parsed.next_cursor ?? null,
    has_more: parsed.has_more ?? false,
  }
}

export function usePacificaTradeHistory(
  account: string | null | undefined,
  params?: PacificaTradeHistoryQueryParams
) {
  return useInfiniteQuery({
    queryKey: ['pacifica', 'trades-history', account, params],
    queryFn: ({ pageParam }) => fetchTradeHistoryPage(account!, pageParam as string | undefined, params),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.next_cursor ? lastPage.next_cursor : undefined,
    enabled: Boolean(account),
    staleTime: 15_000,
  })
}
