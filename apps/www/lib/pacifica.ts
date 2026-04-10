import { env } from '@/env'
import { Keypair, PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'

export const PACIFICA_PROGRAM_ID = new PublicKey('peRPsYCcB1J9jvrs29jiGdjkytxs8uHLmSPLKKP9ptm')
export const PACIFICA_CENTRAL_STATE = new PublicKey('9Gdmhq4Gv1LnNMp7aiS1HSVd7pNnXNMsbuXALCQRmGjY')
export const PACIFICA_VAULT = new PublicKey('72R843XwZxqWhsJceARQQTTbYtWy6Zw9et2YV4FpRHTa')

export const EVENT_AUTHORITY = PublicKey.findProgramAddressSync(
  [Buffer.from('__event_authority')],
  PACIFICA_PROGRAM_ID
)[0]

export const USDP_MINT = new PublicKey('USDPqRbLidFGufty2s3oizmDEKdqx7ePTqzDMbf5ZKM')

export const SPONSOR_WALLET = Keypair.fromSecretKey(bs58.decode(env.FAUCET_PRIVATE_KEY))
