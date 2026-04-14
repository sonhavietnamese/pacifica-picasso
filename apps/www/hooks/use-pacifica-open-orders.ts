'use client'

import { useCallback, useEffect, useState } from 'react'

export type PacificaOpenOrder = {
  order_id: number
  client_order_id: string | null
  symbol: string
  side: 'bid' | 'ask'
  price: string
  initial_amount: string
  filled_amount: string
  cancelled_amount: string
  stop_price: string | null
  order_type: string
  stop_parent_order_id: number | null
  trigger_price_type?: string
  reduce_only: boolean
  instrument_type?: string
  created_at: number
  updated_at: number
}

type GetOpenOrdersResponse = {
  success: boolean
  data: PacificaOpenOrder[]
  error: string | null
  code: number | null
  last_order_id?: number
}

export function usePacificaOpenOrders(account: string | null | undefined) {
  const [orders, setOrders] = useState<PacificaOpenOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOpenOrders = useCallback(async () => {
    if (!account) {
      setOrders([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ account })
      const res = await fetch(`/api/trade/orders?${params.toString()}`, {
        cache: 'no-store',
      })

      const payload = (await res.json()) as GetOpenOrdersResponse
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to fetch open orders')
      }

      setOrders(payload.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch open orders')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [account])

  useEffect(() => {
    void fetchOpenOrders()
  }, [fetchOpenOrders])

  return {
    orders: account ? orders : [],
    isLoading: Boolean(account) && isLoading,
    error: account ? error : null,
    refetch: fetchOpenOrders,
  }
}
