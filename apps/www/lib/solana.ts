import { env } from '@/env'
import { SolanaClientConfig } from '@solana/client'
import { Connection, PublicKey } from '@solana/web3.js'
import { PriceFeed } from '@/types'

export const connection = new Connection(env.NEXT_PUBLIC_SOLANA_RPC_URL)
export const USDP_MINT = new PublicKey('USDPqRbLidFGufty2s3oizmDEKdqx7ePTqzDMbf5ZKM')

export const SOLANA_CONFIG: SolanaClientConfig = {
  cluster: 'devnet',
  rpc: env.NEXT_PUBLIC_SOLANA_RPC_URL,
  websocket: env.NEXT_PUBLIC_SOLANA_RPC_URL,
}

export const CONNECTORS = [{ id: 'wallet-standard:phantom', label: 'Phantom' }]

export const SOL_USD_ORACLE_ADDRESS = new PublicKey('ENYwebBThHzmzwPLAQvCucUTsjyfBSZdD9ViXksS4jPu')

export const SOLUSD_PRICE_FEED: PriceFeed = {
  pyth_lazer_id: 6,
  name: 'SOLUSD',
  symbol: 'Crypto.SOL/USD',
  description: 'SOLANA / US DOLLAR',
  asset_type: 'crypto',
  exponent: -8,
  cmc_id: 5426,
  interval: null,
  min_publishers: 1,
  min_channel: 'fixed_rate@50ms',
  state: 'stable',
}
