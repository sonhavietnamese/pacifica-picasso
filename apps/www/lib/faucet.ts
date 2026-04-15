import { connection, USDP_MINT } from '@/lib/solana'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstructionWithDerivation,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import bs58 from 'bs58'

let faucetWallet: Keypair | null = null

function getFaucetWallet(): Keypair {
  if (!faucetWallet) {
    faucetWallet = Keypair.fromSecretKey(bs58.decode(process.env.FAUCET_PRIVATE_KEY ?? ''))
  }
  return faucetWallet
}

function amountToRaw(amount: number, decimals: number): bigint {
  const factor = 10 ** decimals
  return BigInt(Math.round(amount * factor))
}

export const transfer = async (recipient: PublicKey, amount: number) => {
  const wallet = getFaucetWallet()
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    })
  )
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = wallet.publicKey
  transaction.sign(wallet)
  const signature = await connection.sendRawTransaction(transaction.serialize())
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight })
  return signature
}

export type TransferSplTokenOptions = {
  /** Defaults to `USDP_MINT` */
  mint?: PublicKey
  /** If omitted, decimals are read from chain via `getMint` */
  decimals?: number
}

/**
 * Transfers SPL tokens from the faucet's ATA to the recipient's ATA.
 * Creates the recipient's associated token account idempotently (faucet pays rent).
 */
export const faucet = async (recipient: PublicKey, amount: number, options: TransferSplTokenOptions = {}) => {
  const wallet = getFaucetWallet()
  const mint = options.mint ?? USDP_MINT
  const decimals = options.decimals ?? (await getMint(connection, mint)).decimals

  const sourceAta = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  const destAta = getAssociatedTokenAddressSync(mint, recipient, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID)

  const transaction = new Transaction()
  transaction.add(
    createAssociatedTokenAccountIdempotentInstructionWithDerivation(
      wallet.publicKey,
      recipient,
      mint,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )
  transaction.add(
    createTransferInstruction(sourceAta, destAta, wallet.publicKey, amountToRaw(amount, decimals), [], TOKEN_PROGRAM_ID)
  )

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = wallet.publicKey
  transaction.sign(wallet)

  const signature = await connection.sendRawTransaction(transaction.serialize())
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight })
  return signature
}
