import { PACIFICA_API_ENDPOINTS } from '@/lib/constants'
import { useCallback, useEffect, useState } from 'react'

/** Order row from GET /api/v1/orders — see Pacifica REST docs. */
export type PacificaOpenOrder = {
  order_id: number
  client_order_id: string
  symbol: string
  side: string
  price: string
  initial_amount: string
  filled_amount: string
  cancelled_amount: string
  stop_price: string | null
  order_type: string
  stop_parent_order_id: number | null
  reduce_only: boolean
  created_at: number
  updated_at: number
}

export type PacificaOpenOrdersResponse = {
  success: boolean
  data: PacificaOpenOrder[]
  error: string | null
  code: string | null
  last_order_id: number
}

export function useOpenOrders(account: string | null | undefined) {
  const [orders, setOrders] = useState<PacificaOpenOrder[]>([])
  const [lastOrderId, setLastOrderId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOpenOrders = useCallback(async () => {
    if (!account) {
      setOrders([])
      setLastOrderId(null)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${PACIFICA_API_ENDPOINTS.GET_OPEN_ORDERS}?account=${encodeURIComponent(account)}`)
      const raw = await response.text()
      let body: unknown
      try {
        body = JSON.parse(raw) as unknown
      } catch {
        setOrders([])
        setLastOrderId(null)
        setError(raw || `Request failed (${response.status})`)
        return
      }

      if (!response.ok) {
        const msg =
          typeof body === 'object' &&
          body !== null &&
          'error' in body &&
          typeof (body as { error: unknown }).error === 'string'
            ? (body as { error: string }).error
            : `Request failed (${response.status})`
        setOrders([])
        setLastOrderId(null)
        setError(msg)
        return
      }

      const parsed = body as Partial<PacificaOpenOrdersResponse>
      if (!parsed.success || !Array.isArray(parsed.data)) {
        const apiError =
          typeof parsed.error === 'string' && parsed.error.length > 0 ? parsed.error : 'Unexpected response'
        setOrders([])
        setLastOrderId(null)
        setError(apiError)
        return
      }

      setOrders(parsed.data)
      setLastOrderId(parsed.last_order_id ?? null)
    } catch (e) {
      setOrders([])
      setLastOrderId(null)
      setError(e instanceof Error ? e.message : 'Failed to load open orders')
    } finally {
      setIsLoading(false)
    }
  }, [account])

  useEffect(() => {
    void fetchOpenOrders()
  }, [fetchOpenOrders])

  return {
    orders,
    lastOrderId,
    isLoading,
    error,
    refetch: fetchOpenOrders,
  }
}
