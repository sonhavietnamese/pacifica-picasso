import { PacificaClient } from 'pacifica.js'
import {} from 'pacifica-ts-sdk'

const client = new PacificaClient({
  privateKey: process.env.PRIVATE_KEY,
  testnet: true,
})

const limitOrder = await client.api.createLimitOrder({
  symbol: 'BTC',
  price: '80000',
  amount: '0.01',
  side: 'bid',
  tif: 'GTC',
  reduce_only: false,
  client_order_id: crypto.randomUUID(),
})

console.log('Limit order:', limitOrder)
