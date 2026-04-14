import { PacificaClient } from 'pacifica.js'

/** Matches pacifica.js internal defaults (see `WebSocketClient` constructor). */
export const PACIFICA_WS_URL_MAINNET = 'wss://ws.pacifica.fi/ws'
export const PACIFICA_WS_URL_TESTNET = 'wss://test-ws.pacifica.fi/ws'

export function pacificaWsUrl(testnet: boolean): string {
  return testnet ? PACIFICA_WS_URL_TESTNET : PACIFICA_WS_URL_MAINNET
}

type Pool = {
  client: PacificaClient
  refCount: number
  /** Refcount per account for `account_info` — only first subscriber sends subscribe. */
  accountInfoByAccount: Map<string, number>
  /** Refcount per account for `account_positions`. */
  accountPositionsByAccount: Map<string, number>
  /** Refcount per account for `account_trades`. */
  accountTradesByAccount: Map<string, number>
  /** Refcount per account for `account_order_updates`. */
  accountOrderUpdatesByAccount: Map<string, number>
  /** How many hooks consume the `prices` channel. */
  priceStreamRefCount: number
}

const pools = new Map<string, Pool>()

function getPool(wsUrl: string): Pool {
  let pool = pools.get(wsUrl)
  if (!pool) {
    const testnet = wsUrl.includes('test-ws.pacifica')
    pool = {
      client: new PacificaClient({ wsUrl, testnet }),
      refCount: 0,
      accountInfoByAccount: new Map(),
      accountPositionsByAccount: new Map(),
      accountTradesByAccount: new Map(),
      accountOrderUpdatesByAccount: new Map(),
      priceStreamRefCount: 0,
    }
    pools.set(wsUrl, pool)
  }
  return pool
}

/**
 * Take a shared {@link PacificaClient} for `wsUrl`. First acquire connects; last `release` disconnects.
 */
export function acquirePacificaClient(wsUrl: string): PacificaClient {
  const pool = getPool(wsUrl)
  pool.refCount++
  if (pool.refCount === 1) {
    pool.client.connect()
  }
  return pool.client
}

export function releasePacificaClient(wsUrl: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  pool.refCount--
  if (pool.refCount <= 0) {
    pool.client.disconnect()
    pools.delete(wsUrl)
  }
}

export function subscribeAccountInfoChannel(wsUrl: string, account: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  const next = (pool.accountInfoByAccount.get(account) ?? 0) + 1
  pool.accountInfoByAccount.set(account, next)
  if (next === 1) {
    pool.client.ws.subscribeAccountInfo(account)
  }
}

export function unsubscribeAccountInfoChannel(wsUrl: string, account: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  const prev = pool.accountInfoByAccount.get(account) ?? 0
  if (prev <= 0) return
  const next = prev - 1
  if (next <= 0) {
    pool.accountInfoByAccount.delete(account)
    pool.client.ws.unsubscribe({ source: 'account_info', account })
  } else {
    pool.accountInfoByAccount.set(account, next)
  }
}

export function subscribeAccountPositionsChannel(wsUrl: string, account: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  const next = (pool.accountPositionsByAccount.get(account) ?? 0) + 1
  pool.accountPositionsByAccount.set(account, next)
  if (next === 1) {
    pool.client.ws.subscribeAccountPositions(account)
  }
}

export function unsubscribeAccountPositionsChannel(wsUrl: string, account: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  const prev = pool.accountPositionsByAccount.get(account) ?? 0
  if (prev <= 0) return
  const next = prev - 1
  if (next <= 0) {
    pool.accountPositionsByAccount.delete(account)
    pool.client.ws.unsubscribe({ source: 'account_positions', account })
  } else {
    pool.accountPositionsByAccount.set(account, next)
  }
}

export function subscribeAccountTradesChannel(wsUrl: string, account: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  const next = (pool.accountTradesByAccount.get(account) ?? 0) + 1
  pool.accountTradesByAccount.set(account, next)
  if (next === 1) {
    pool.client.ws.subscribeAccountTrades(account)
  }
}

export function unsubscribeAccountTradesChannel(wsUrl: string, account: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  const prev = pool.accountTradesByAccount.get(account) ?? 0
  if (prev <= 0) return
  const next = prev - 1
  if (next <= 0) {
    pool.accountTradesByAccount.delete(account)
    pool.client.ws.unsubscribe({ source: 'account_trades', account })
  } else {
    pool.accountTradesByAccount.set(account, next)
  }
}

export function subscribeAccountOrderUpdatesChannel(wsUrl: string, account: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  const next = (pool.accountOrderUpdatesByAccount.get(account) ?? 0) + 1
  pool.accountOrderUpdatesByAccount.set(account, next)
  if (next === 1) {
    pool.client.ws.subscribeAccountOrderUpdates(account)
  }
}

export function unsubscribeAccountOrderUpdatesChannel(wsUrl: string, account: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  const prev = pool.accountOrderUpdatesByAccount.get(account) ?? 0
  if (prev <= 0) return
  const next = prev - 1
  if (next <= 0) {
    pool.accountOrderUpdatesByAccount.delete(account)
    pool.client.ws.unsubscribe({ source: 'account_order_updates', account })
  } else {
    pool.accountOrderUpdatesByAccount.set(account, next)
  }
}

export function subscribePricesChannel(wsUrl: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  pool.priceStreamRefCount++
  if (pool.priceStreamRefCount === 1) {
    pool.client.ws.subscribePrices()
  }
}

export function unsubscribePricesChannel(wsUrl: string): void {
  const pool = pools.get(wsUrl)
  if (!pool) return
  if (pool.priceStreamRefCount <= 0) return
  pool.priceStreamRefCount--
  if (pool.priceStreamRefCount <= 0) {
    pool.priceStreamRefCount = 0
    pool.client.ws.unsubscribe({ source: 'prices' })
  }
}

/**
 * Run `fn` when the socket is open. If already connected, runs synchronously.
 * Returns a cleanup that removes a pending `open` listener (no-op if already ran).
 */
export function runWhenPacificaSocketOpen(client: PacificaClient, fn: () => void): () => void {
  if (client.isConnected()) {
    fn()
    return () => {}
  }
  const onOpen = () => {
    fn()
  }
  client.ws.on('open', onOpen)
  return () => {
    client.ws.off('open', onOpen)
  }
}
