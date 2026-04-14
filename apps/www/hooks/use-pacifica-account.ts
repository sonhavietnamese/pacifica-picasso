'use client'

import { PACIFICA_WS_URL } from '@/lib/constants'
import {
  acquirePacificaClient,
  releasePacificaClient,
  runWhenPacificaSocketOpen,
  subscribeAccountInfoChannel,
  unsubscribeAccountInfoChannel,
} from '@/lib/pacifica-ws-pool'
import { type AccountInfo } from 'pacifica.js'
import { useEffect, useState } from 'react'

/**
 * Account snapshot from the `account_info` WebSocket channel.
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/account-info
 */
export type PacificaAccountData = AccountInfo

type LiveSession = {
  account: string
  snapshot: AccountInfo
}

export function usePacificaAccount(account: string | null | undefined) {
  const [live, setLive] = useState<LiveSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'open' | 'closed'>('idle')

  const data =
    account && live?.account === account ? live.snapshot : undefined

  useEffect(() => {
    if (!account) return

    const wsUrl = PACIFICA_WS_URL
    const client = acquirePacificaClient(wsUrl)
    let cancelled = false

    // Reset session for this account when the subscription effect runs (WebSocket connects async).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    setError(null)
    setConnectionStatus('connecting')

    const removeOpenListener = runWhenPacificaSocketOpen(client, () => {
      if (cancelled) return
      subscribeAccountInfoChannel(wsUrl, account)
      setConnectionStatus('open')
    })

    const onAccountInfo = (info: AccountInfo) => {
      if (cancelled) return
      setLive({ account, snapshot: info })
      setIsLoading(false)
      setError(null)
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
      setIsLoading(false)
    }

    const onError = () => {
      if (cancelled) return
      setError('Connection error')
      setIsLoading(false)
    }

    const onClose = () => {
      if (cancelled) return
      setConnectionStatus('closed')
    }

    client.ws.on('account_info', onAccountInfo)
    client.ws.on('ws_error', onWsError)
    client.ws.on('error', onError)
    client.ws.on('close', onClose)

    return () => {
      cancelled = true
      removeOpenListener?.()
      unsubscribeAccountInfoChannel(wsUrl, account)
      client.ws.off('account_info', onAccountInfo)
      client.ws.off('ws_error', onWsError)
      client.ws.off('error', onError)
      client.ws.off('close', onClose)
      releasePacificaClient(wsUrl)
    }
  }, [account])

  const active = Boolean(account)
  return {
    data,
    isLoading: active && isLoading,
    error: active ? error : null,
    connectionStatus: active ? connectionStatus : 'idle',
  }
}
