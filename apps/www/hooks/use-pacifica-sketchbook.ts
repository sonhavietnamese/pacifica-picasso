'use client'

import { PACIFICA_WS_URL } from '@/lib/constants'
import {
  acquirePacificaClient,
  releasePacificaClient,
  runWhenPacificaSocketOpen,
  subscribeAccountPositionsChannel,
  subscribeAccountTradesChannel,
  unsubscribeAccountPositionsChannel,
  unsubscribeAccountTradesChannel,
} from '@/lib/pacifica-ws-pool'
import { type Position, type Trade } from 'pacifica.js'
import { useEffect, useState } from 'react'

const MAX_TRADES = 80

export type PacificaSketchbookState = {
  /** Open positions from REST + `account_positions` stream. */
  positions: Position[]
  /** Recent fills from `account_trades` (newest first, capped). */
  recentTrades: Trade[]
  isLoading: boolean
  error: string | null
  connectionStatus: 'idle' | 'connecting' | 'open' | 'closed'
}

/**
 * Loads open positions via REST, then keeps them live via `account_positions` and appends fills from `account_trades`.
 *
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/account-positions
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/account-trades
 */
export function usePacificaSketchbook(account: string | null | undefined): PacificaSketchbookState {
  const [positions, setPositions] = useState<Position[]>([])
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<PacificaSketchbookState['connectionStatus']>('idle')

  useEffect(() => {
    if (!account) {
      return
    }

    setPositions([])
    setRecentTrades([])

    const wsUrl = PACIFICA_WS_URL
    const client = acquirePacificaClient(wsUrl)
    let cancelled = false

    setIsLoading(true)
    setError(null)
    setConnectionStatus('connecting')

    const loadPositions = async () => {
      try {
        const rows = await client.api.getPositions(account)
        if (!cancelled) {
          setPositions(rows)
          setIsLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load positions')
          setIsLoading(false)
        }
      }
    }

    void loadPositions()

    const onPositions = (rows: Position[]) => {
      if (cancelled) return
      setPositions(rows)
      setIsLoading(false)
      setError(null)
    }

    const onTrades = (batch: Trade[]) => {
      if (cancelled || batch.length === 0) return
      // setRecentTrades((prev) => {
      //   const merged = [...batch, ...prev]
      //   const seen = new Set<number>()
      //   const deduped: Trade[] = []
      //   for (const t of merged) {
      //     if (seen.has(t.history_id)) continue
      //     seen.add(t.history_id)
      //     deduped.push(t)
      //   }
      //   return deduped.slice(0, MAX_TRADES)
      // })
      setRecentTrades((prev) => [...batch, ...prev].slice(0, MAX_TRADES))
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
    }

    const onClose = () => {
      if (cancelled) return
      setConnectionStatus('closed')
    }

    client.ws.on('account_positions', onPositions)
    client.ws.on('account_trades', onTrades)
    client.ws.on('ws_error', onWsError)
    client.ws.on('error', onError)
    client.ws.on('close', onClose)

    const removeOpenListener = runWhenPacificaSocketOpen(client, () => {
      if (cancelled) return
      subscribeAccountPositionsChannel(wsUrl, account)
      subscribeAccountTradesChannel(wsUrl, account)
      setConnectionStatus('open')
    })

    return () => {
      cancelled = true
      removeOpenListener?.()
      unsubscribeAccountPositionsChannel(wsUrl, account)
      unsubscribeAccountTradesChannel(wsUrl, account)
      client.ws.off('account_positions', onPositions)
      client.ws.off('account_trades', onTrades)
      client.ws.off('ws_error', onWsError)
      client.ws.off('error', onError)
      client.ws.off('close', onClose)
      releasePacificaClient(wsUrl)
    }
  }, [account])

  const active = Boolean(account)
  return {
    positions: active ? positions : [],
    recentTrades: active ? recentTrades : [],
    isLoading: active && isLoading,
    error: active ? error : null,
    connectionStatus: active ? connectionStatus : 'idle',
  }
}
