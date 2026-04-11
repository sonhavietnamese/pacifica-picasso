import { PacificaClient } from 'pacifica.js'

/** Perp symbol on Pacifica (see REST `getPrices` / WS `prices`). */
const SYMBOL = 'BTC'

const client = new PacificaClient({
  testnet: true,
})

client.ws.on('open', () => {
  console.log('WebSocket connected — subscribing to prices')
  client.ws.subscribePrices()
})

client.ws.on('prices', (prices) => {
  const p = prices.find((row) => row.symbol === SYMBOL)
  if (!p) return
  const ts = new Date(p.timestamp).toISOString()
  console.log(
    `[${ts}] ${p.symbol} mark=${p.mark} mid=${p.mid} oracle=${p.oracle} funding=${p.funding} vol24h=${p.volume_24h}`
  )
})

client.ws.on('error', (err) => {
  console.error('WebSocket error:', err)
})

client.ws.on('close', (code, reason) => {
  console.log('WebSocket closed:', code, reason?.toString?.() ?? reason)
})

client.connect()

function shutdown() {
  client.disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
