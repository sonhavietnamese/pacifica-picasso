import { env } from '@/env'
import { Keypair, PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'

export const PACIFICA_PROGRAM_ID = new PublicKey('peRPsYCcB1J9jvrs29jiGdjkytxs8uHLmSPLKKP9ptm')
export const PACIFICA_CENTRAL_STATE = new PublicKey('2zPRq1Qvdq5A4Ld6WsH7usgCge4ApZRYfhhf5VAjfXxv')
export const PACIFICA_VAULT = new PublicKey('5SDFdHZGTZbyRYu54CgmRkCGnPHC5pYaN27p7XGLqnBs')

export const EVENT_AUTHORITY = PublicKey.findProgramAddressSync(
  [Buffer.from('__event_authority')],
  PACIFICA_PROGRAM_ID
)[0]

export const USDP_MINT = new PublicKey('USDPqRbLidFGufty2s3oizmDEKdqx7ePTqzDMbf5ZKM')

export const SPONSOR_WALLET = Keypair.fromSecretKey(bs58.decode(env.FAUCET_PRIVATE_KEY))
