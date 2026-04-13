'use client'

import { usePrivy } from '@privy-io/react-auth'
import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

type FaucetPhase = 'idle' | 'faucet' | 'deposit' | 'success' | 'error'

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const j = JSON.parse(text) as { error?: string; message?: string }
    if (typeof j.error === 'string' && j.error) return j.error
    if (typeof j.message === 'string' && j.message) return j.message
  } catch {
    /* not JSON */
  }
  return text.trim() || response.statusText || 'Request failed'
}

export default function SectionBeta() {
  const { user } = usePrivy()
  const [phase, setPhase] = useState<FaucetPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const successResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (successResetRef.current) clearTimeout(successResetRef.current)
    }
  }, [])

  const embeddedReady = Boolean(user?.wallet?.connectorType === 'embedded' && user.wallet.id)

  const isBusy = phase === 'faucet' || phase === 'deposit'

  const runFaucetFlow = useCallback(async () => {
    if (!user?.wallet || user.wallet.connectorType !== 'embedded' || !user.wallet.id) return

    setErrorMessage(null)
    setPhase('faucet')

    try {
      const faucetRes = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: user.wallet.id }),
      })

      if (!faucetRes.ok) {
        setErrorMessage(await readErrorMessage(faucetRes))
        setPhase('error')
        return
      }

      setPhase('deposit')

      const depositRes = await fetch('/api/trade/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: user.wallet.id }),
      })

      if (!depositRes.ok) {
        setErrorMessage(await readErrorMessage(depositRes))
        setPhase('error')
        return
      }

      setPhase('success')
      if (successResetRef.current) clearTimeout(successResetRef.current)
      successResetRef.current = setTimeout(() => {
        setPhase('idle')
        successResetRef.current = null
      }, 2500)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Something went wrong')
      setPhase('error')
    }
  }, [user])

  const progressLabel =
    phase === 'faucet'
      ? 'Requesting USDP from fauce'
      : phase === 'deposit'
        ? 'Depositing to Pacifica'
        : phase === 'success'
          ? 'Done'
          : null

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.2 }}
      className="p-4 rounded-xl bg-[#171717] mt-2 gap-2 flex flex-col"
    >
      <div>
        <div id="title">
          <span className="font-druk text-white text-base leading-none">Beta*</span>
        </div>

        <div className="font-sans gap-1 mt-2">
          <div>
            <span className="text-white/70 text-sm leading-none">
              We are running beta test phase, willing to use test token to experience the app
            </span>
          </div>

          {!embeddedReady && user ? (
            <p className="mt-2 text-xs text-white/50">USDP Faucet requires the embedded Solana wallet.</p>
          ) : null}

          {errorMessage && phase === 'error' ? <p className="mt-2 text-sm text-red-400/90">{errorMessage}</p> : null}

          <div className="w-full mt-4 flex flex-col gap-2">
            {progressLabel ? (
              <p className="text-white/80 text-sm text-center font-medium min-h-5" aria-live="polite">
                {progressLabel}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void runFaucetFlow()}
              disabled={!embeddedReady || isBusy || phase === 'success'}
              className="bg-white text-black rounded-xl py-3 px-2 text-center w-full font-druk leading-none disabled:opacity-45 disabled:cursor-not-allowed enabled:hover:bg-white/90 transition-colors"
            >
              {isBusy ? 'Hang on' : 'USDP Faucet'}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
