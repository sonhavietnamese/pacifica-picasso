'use client'

import { usePacificaAccount } from '@/hooks/use-pacifica-account'
import { User } from '@privy-io/react-auth'
import NumberFlow from '@number-flow/react'

function parseUsdString(value: string | undefined): number {
  const n = Number.parseFloat(value ?? '0')
  return Number.isFinite(n) ? n : 0
}

export default function SectionAccount({ user }: { user: User }) {
  const address = user.wallet?.address
  const { data: account, isLoading, error } = usePacificaAccount(address)

  const equity = parseUsdString(account?.account_equity)
  const balance = parseUsdString(account?.balance)
  const pending = parseUsdString(account?.pending_balance)

  const showNumbers = Boolean(address) && !isLoading && !error

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="w-full h-full p-4 bg-[#171717] mt-2 rounded-xl">
        <div>
          <span className="font-druk text-white text-base leading-none">Accounts</span>
        </div>

        {!address ? (
          <p className="mt-2 text-sm text-white/50">Connect a wallet to see balances.</p>
        ) : (
          <>
            {error ? <p className="mt-2 text-sm text-red-400/90">{error}</p> : null}

            <div className="font-sans gap-1 mt-2 space-y-1">
              <div className="grid grid-cols-2">
                <span className="text-white/70 text-sm">Balance</span>
                <span className="text-white/70 text-sm text-right font-druk">
                  {showNumbers ? <NumberFlow value={balance} prefix="$" /> : <span className="text-white/40">—</span>}
                </span>
              </div>

              <div className="grid grid-cols-2">
                <span className="text-white/70 text-sm">Equity</span>
                <span className="text-white/70 text-sm text-right font-druk">
                  {showNumbers ? <NumberFlow value={equity} prefix="$" /> : <span className="text-white/40">—</span>}
                </span>
              </div>

              <div className="grid grid-cols-2">
                <span className="text-white/70 text-sm">Unrealized PnL</span>
                <span className="text-white/70 text-sm text-right font-druk">
                  {showNumbers ? <NumberFlow value={pending} prefix="$" /> : <span className="text-white/40">—</span>}
                </span>
              </div>

              <div className=""></div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
