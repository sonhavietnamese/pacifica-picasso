'use client'

import { PACIFICA_WS_URL } from '@/lib/constants'
import {
  acquirePacificaClient,
  releasePacificaClient,
  runWhenPacificaSocketOpen,
  subscribeAccountOrderUpdatesChannel,
  subscribeAccountTradesChannel,
  unsubscribeAccountOrderUpdatesChannel,
  unsubscribeAccountTradesChannel,
} from '@/lib/pacifica-ws-pool'
import { type ExtractEventData, type Trade } from 'pacifica.js'
import { useEffect, useState } from 'react'

const MAX_TRADES = 80
const MAX_ORDER_UPDATES = 80

/** One row from `account_order_updates` after SDK normalization (`order` + `update_type`). */
export type PacificaOrderUpdateEntry = ExtractEventData<'account_order_updates'>[number]

export type PacificaSketchbookState = {
  /** Recent fills from `account_trades` (newest first, capped). */
  recentTrades: Trade[]
  /** Lifecycle updates from `account_order_updates` (newest first, capped). */
  recentOrderUpdates: PacificaOrderUpdateEntry[]
  isLoading: boolean
  error: string | null
  connectionStatus: 'idle' | 'connecting' | 'open' | 'closed'
}

/**
 * Appends fills from `account_trades` and order lifecycle from `account_order_updates`.
 * Open positions for the Live tab are loaded via REST (`usePacificaTradeHistory`).
 *
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/account-trades
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/account-order-updates
 */
export function usePacificaSketchbook(account: string | null | undefined): PacificaSketchbookState {
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [recentOrderUpdates, setRecentOrderUpdates] = useState<PacificaOrderUpdateEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<PacificaSketchbookState['connectionStatus']>('idle')

  useEffect(() => {
    if (!account) {
      return
    }

    setRecentTrades([])
    setRecentOrderUpdates([])

    const wsUrl = PACIFICA_WS_URL
    const client = acquirePacificaClient(wsUrl)
    let cancelled = false

    setIsLoading(true)
    setError(null)
    setConnectionStatus('connecting')

    const onTrades = (batch: Trade[]) => {
      if (cancelled || batch.length === 0) return
      setRecentTrades((prev) => [...batch, ...prev].slice(0, MAX_TRADES))
    }

    const onOrderUpdates = (batch: ExtractEventData<'account_order_updates'>) => {
      if (cancelled || batch.length === 0) return
      setRecentOrderUpdates((prev) => [...batch, ...prev].slice(0, MAX_ORDER_UPDATES))
    }

    const onWsError = (payload: unknown) => {
      if (cancelled) return
      const msg =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String((payload as { message: unknown }).message)
          : typeof payload === 'string'
            ? payload
            : 'WebSocket error'
      setError(msg)
    }

    const onError = () => {
      if (cancelled) return
      setError('Connection error')
      setIsLoading(false)
    }

    const onClose = () => {
      if (cancelled) return
      setConnectionStatus('closed')
      setIsLoading(false)
    }

    client.ws.on('account_trades', onTrades)
    client.ws.on('account_order_updates', onOrderUpdates)
    client.ws.on('ws_error', onWsError)
    client.ws.on('error', onError)
    client.ws.on('close', onClose)

    const removeOpenListener = runWhenPacificaSocketOpen(client, () => {
      if (cancelled) return
      subscribeAccountTradesChannel(wsUrl, account)
      subscribeAccountOrderUpdatesChannel(wsUrl, account)
      setConnectionStatus('open')
      setIsLoading(false)
    })

    return () => {
      cancelled = true
      removeOpenListener?.()
      unsubscribeAccountTradesChannel(wsUrl, account)
      unsubscribeAccountOrderUpdatesChannel(wsUrl, account)
      client.ws.off('account_trades', onTrades)
      client.ws.off('account_order_updates', onOrderUpdates)
      client.ws.off('ws_error', onWsError)
      client.ws.off('error', onError)
      client.ws.off('close', onClose)
      releasePacificaClient(wsUrl)
    }
  }, [account])

  const active = Boolean(account)
  return {
    recentTrades: active ? recentTrades : [],
    recentOrderUpdates: active ? recentOrderUpdates : [],
    isLoading: active && isLoading,
    error: active ? error : null,
    connectionStatus: active ? connectionStatus : 'idle',
  }
}
