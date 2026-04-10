import { ed25519 } from '@noble/curves/ed25519'
import bs58 from 'bs58'
import { Keypair } from '@solana/web3.js'

const BASE_URL = 'https://test-api.pacifica.fi/api/v1'

type MarketInfo = {
  symbol: string
  tick_size: string
  min_tick: string
  max_tick: string
  lot_size: string
  max_leverage: number
  isolated_only: boolean
  min_order_size: string
  max_order_size: string
  funding_rate: string
  next_funding_rate: string
  created_at: number
}

type MarketInfoResponse = {
  success: boolean
  data: MarketInfo[]
  error?: null | string
  code?: number | null
}

const keypairFromEnv = (): Keypair => {
  const hex = process.env.PRIVATE_KEY?.replace(/^0x/i, '') ?? ''
  const bytes = Buffer.from(hex, 'hex')
  if (bytes.length === 64) return Keypair.fromSecretKey(bytes)
  if (bytes.length === 32) return Keypair.fromSeed(bytes)
  throw new Error(
    `PRIVATE_KEY must decode to 32 bytes (seed) or 64 bytes (full secret key); got ${bytes.length} bytes`,
  )
}

const keypair = keypairFromEnv()

const sortJsonKeys = (value: any) => {
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value)
      .sort()
      .reduce((acc: any, key: string) => {
        acc[key] = sortJsonKeys(value[key])
        return acc
      }, {})
  }
  return value
}

const main = async () => {
  // const response = await fetch(`${BASE_URL}/info`)
  // const data: MarketInfoResponse = (await response.json()) as MarketInfoResponse
  // console.log(data)

  console.log('Creating order....')
  const API_URL = 'https://api.pacifica.fi/api/v1/orders/create'
  const operation_type = 'create_order'
  const operation_data = {
    symbol: 'BTC',
    price: '100000',
    amount: '0.1',
    side: 'bid',
    tif: 'GTC',
    reduce_only: false,
    client_order_id: crypto.randomUUID(),
  }

  const timestamp = Math.floor(Date.now() / 1000)

  const signature_header = {
    timestamp: timestamp,
    expiry_window: 5_000,
    type: 'create_order',
  }

  const data_to_sign = {
    ...signature_header,
    data: operation_data,
  }

  const sorted_message = sortJsonKeys(data_to_sign)

  const message_bytes = new TextEncoder().encode(JSON.stringify(sorted_message))

  const privateScalar = keypair.secretKey.slice(0, 32)
  const signature = ed25519.sign(message_bytes, privateScalar)
  const signature_base58 = bs58.encode(signature)

  console.log('signature (base58):', signature_base58)
}
main()
