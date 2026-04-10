import { address, getProgramDerivedAddress, getU64Encoder } from '@solana/kit'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { PACIFICA_CENTRAL_STATE, PACIFICA_PROGRAM_ID, PACIFICA_VAULT, USDP_MINT } from './pacifica'

const DEPOSIT_DECIMALS = 6

const u64Encoder = getU64Encoder()

/**
 * Anchor-style discriminator: sha256("global:{name}")[0..8] via Web Crypto (no Node `crypto`).
 */
async function anchorDiscriminator(name: string): Promise<Uint8Array> {
  const preimage = new TextEncoder().encode(`global:${name}`)
  const digest = await crypto.subtle.digest('SHA-256', preimage)
  return new Uint8Array(digest).slice(0, 8)
}

/**
 * Instruction payload: 8-byte Anchor discriminator + u64 LE amount (@solana/kit codec).
 */
export async function buildDepositInstructionData(amount: number): Promise<Uint8Array> {
  const amountRaw = BigInt(Math.round(amount * 10 ** DEPOSIT_DECIMALS))
  const disc = await anchorDiscriminator('deposit')
  const amountBytes = u64Encoder.encode(amountRaw)
  const out = new Uint8Array(disc.length + amountBytes.length)
  out.set(disc, 0)
  out.set(amountBytes, disc.length)
  return out
}

/** Event authority PDA — uses `@solana/kit` `getProgramDerivedAddress` (same result as web3.js). */
export async function getDepositEventAuthority(): Promise<PublicKey> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: address(PACIFICA_PROGRAM_ID.toBase58()),
    seeds: [new TextEncoder().encode('__event_authority')],
  })
  return new PublicKey(pda)
}

export async function buildPacificaDepositTransaction(
  depositor: PublicKey,
  amount: number
): Promise<{
  transaction: Transaction
}> {
  const depositorUsdpAta = getAssociatedTokenAddressSync(
    USDP_MINT,
    depositor,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  const eventAuthority = await getDepositEventAuthority()
  console.log('eventAuthority', eventAuthority)
  const instructionData = await buildDepositInstructionData(amount)

  const keys = [
    { pubkey: depositor, isSigner: true, isWritable: true },
    { pubkey: depositorUsdpAta, isSigner: false, isWritable: true },
    { pubkey: PACIFICA_CENTRAL_STATE, isSigner: false, isWritable: true },
    { pubkey: PACIFICA_VAULT, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: USDP_MINT, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: eventAuthority, isSigner: false, isWritable: false },
    { pubkey: PACIFICA_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  const instruction = new TransactionInstruction({
    programId: PACIFICA_PROGRAM_ID,
    keys,
    data: Buffer.from(instructionData),
  })

  const transaction = new Transaction().add(instruction)

  return { transaction }
}
