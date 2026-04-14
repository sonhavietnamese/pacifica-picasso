'use client'

import { PACIFICA_API_ENDPOINTS } from '@/lib/constants'
import type { OrderSide } from 'pacifica.js'
import { useQuery } from '@tanstack/react-query'

/**
 * One open position from GET /api/v1/positions.
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-positions
 */
export type PacificaPosition = {
  symbol: string
  /** Long/short as `bid` / `ask` per API. */
  side: string
  amount: string
  entry_price: string
  /** Only meaningful for isolated margin. */
  margin: string
  funding: string
  isolated: boolean
  created_at: number
  updated_at: number
  liquidation_price?: string
}

type PacificaPositionsResponse = {
  success: boolean
  data: PacificaPosition[]
  error: string | null
  code: string | null
  last_order_id?: number
}

export function positionSideToOrderSide(side: string): OrderSide {
  return side === 'ask' || side === 'bid' ? side : 'bid'
}

async function fetchPositions(account: string): Promise<PacificaPosition[]> {
  const response = await fetch(
    `${PACIFICA_API_ENDPOINTS.GET_POSITIONS}?account=${encodeURIComponent(account)}`
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

  const parsed = body as Partial<PacificaPositionsResponse>
  if (!parsed.success || !Array.isArray(parsed.data)) {
    const apiError =
      typeof parsed.error === 'string' && parsed.error.length > 0 ? parsed.error : 'Unexpected response'
    throw new Error(apiError)
  }

  return parsed.data
}

export function usePacificaPositions(account: string | null | undefined) {
  return useQuery({
    queryKey: ['pacifica', 'positions', account],
    queryFn: () => fetchPositions(account!),
    enabled: Boolean(account),
    staleTime: 15_000,
  })
}
