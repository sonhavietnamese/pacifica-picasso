import { env } from '@/env'
import { SolanaClientConfig } from '@solana/client'
import { Connection, PublicKey } from '@solana/web3.js'

export const connection = new Connection(env.NEXT_PUBLIC_SOLANA_RPC_URL)
export const USDP_MINT = new PublicKey('USDPqRbLidFGufty2s3oizmDEKdqx7ePTqzDMbf5ZKM')

export const SOLANA_CONFIG: SolanaClientConfig = {
  cluster: 'devnet',
  rpc: env.NEXT_PUBLIC_SOLANA_RPC_URL,
  websocket: env.NEXT_PUBLIC_SOLANA_RPC_URL,
}

export const CONNECTORS = [{ id: 'wallet-standard:phantom', label: 'Phantom' }]
