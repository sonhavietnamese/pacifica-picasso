'use client'

import { PacificaClient, type PriceData } from 'pacifica.js'
import { useEffect, useRef } from 'react'

type Status = 'connecting' | 'open' | 'closed'

export type UsePacificaPriceStreamOptions = {
  /** Defaults to `false` (mainnet), matching `pacifica.js` defaults. */
  testnet?: boolean
  onStatus?: (status: Status, error?: string) => void
  minEmitIntervalMs?: number
}

/**
 * Live mark price for `symbol` via {@link PacificaClient} WebSocket:
 * `subscribePrices()` + `prices` events (see [pacifica-ts](https://github.com/kesar/pacifica-ts)).
 */
export function usePacificaPriceStream(
  symbol: string,
  onPriceUsd: (priceUsd: number, tick: PriceData) => void,
  options?: UsePacificaPriceStreamOptions
) {
  const testnet = options?.testnet ?? false
  const minEmitIntervalMs = options?.minEmitIntervalMs ?? 150
  const onPriceRef = useRef(onPriceUsd)
  const onStatusRef = useRef(options?.onStatus)
  const lastEmitRef = useRef(0)

  useEffect(() => {
    onPriceRef.current = onPriceUsd
  }, [onPriceUsd])

  useEffect(() => {
    onStatusRef.current = options?.onStatus
  }, [options?.onStatus])

  useEffect(() => {
    let cancelled = false

    const client = new PacificaClient({ testnet })

    const onOpen = () => {
      if (cancelled) return
      onStatusRef.current?.('open')
      client.ws.subscribePrices()
    }

    const onPrices = (prices: PriceData[]) => {
      if (cancelled) return
      const row = prices.find((p) => p.symbol === symbol)
      if (!row) return
      const usd = parseFloat(row.mark)
      if (!Number.isFinite(usd) || usd <= 0) return
      const now = performance.now()
      if (now - lastEmitRef.current < minEmitIntervalMs) return
      lastEmitRef.current = now
      onPriceRef.current(usd, row)
    }

    const onError = () => {
      if (!cancelled) onStatusRef.current?.('closed', 'WebSocket error')
    }

    const onClose = () => {
      if (!cancelled) onStatusRef.current?.('closed')
    }

    client.ws.on('open', onOpen)
    client.ws.on('prices', onPrices)
    client.ws.on('error', onError)
    client.ws.on('close', onClose)

    onStatusRef.current?.('connecting')
    client.connect()

    return () => {
      cancelled = true
      client.ws.off('open', onOpen)
      client.ws.off('prices', onPrices)
      client.ws.off('error', onError)
      client.ws.off('close', onClose)
      client.disconnect()
    }
  }, [symbol, testnet, minEmitIntervalMs])
}
