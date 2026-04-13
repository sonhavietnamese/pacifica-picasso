'use client'

import { useCallback, useRef, useState } from 'react'
import { TOKENS } from '@/lib/constants'
import { useTokenStore } from '@/stores/token'
import { Token } from '@/types'
import { usePacificaPriceStream } from '@/hooks/use-pacifica-price-stream'

const VOLATILITY_WINDOW = 20
const FLASH_DURATION_MS = 200

function computeVolatility(prices: number[]): number {
  if (prices.length < 2) return 0
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]))
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length
  return Math.sqrt(variance) * 100_000
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

function FeedItem({ token }: { token: Token }) {
  const { setToken } = useTokenStore()
  const [price, setPrice] = useState<number | null>(null)
  const [volatility, setVolatility] = useState(0)
  const [flashing, setFlashing] = useState(false)
  const priceHistoryRef = useRef<number[]>([])
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPriceRef = useRef<number | null>(null)
  const prevVolRef = useRef<number>(0)

  const triggerFlash = useCallback(() => {
    setFlashing(true)
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    flashTimeoutRef.current = setTimeout(() => setFlashing(false), FLASH_DURATION_MS)
  }, [])

  const onPrice = useCallback(
    (priceUsd: number) => {
      const history = priceHistoryRef.current
      history.push(priceUsd)
      if (history.length > VOLATILITY_WINDOW) history.shift()

      const newVol = computeVolatility(history)

      const priceChanged = prevPriceRef.current !== null && prevPriceRef.current !== priceUsd
      const volChanged = Math.abs(newVol - prevVolRef.current) > 0.01

      if (priceChanged || volChanged) triggerFlash()

      prevPriceRef.current = priceUsd
      prevVolRef.current = newVol
      setPrice(priceUsd)
      setVolatility(newVol)
    },
    [triggerFlash]
  )

  usePacificaPriceStream(token.symbol, onPrice, { testnet: true })

  return (
    <li
      onClick={() => setToken(token)}
      className="font-druk text-lg flex flex-col cursor-pointer px-2.5 py-2 rounded-xl opacity-80 hover:opacity-100 transition-all duration-250"
      style={{
        backgroundColor: flashing ? 'rgba(255, 255, 255, 0.20)' : 'transparent',
      }}
    >
      <span className="leading-none">{token.symbol}/USD</span>
      <div className="flex gap-2 items-center mt-1">
        <span className="text-[10px] text-white/70">{price !== null ? `$${formatPrice(price)}` : '—'}</span>
        <div id="volatility" className="flex items-center gap-1">
          <figure className="w-4 aspect-square">
            <svg
              className="w-full h-full"
              width="172"
              height="172"
              viewBox="0 0 172 172"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.07275 114.859L60.0728 28.8589L66.0728 170.359L128.073 0.858887L138.573 114.859L169.573 63.8589"
                stroke="white"
                strokeWidth="10"
              />
            </svg>
          </figure>

          <span id="volatility-percentage" className="text-[10px] text-white/70 leading-none">
            {volatility > 0 ? `${volatility.toFixed(1)}%` : '—'}
          </span>
        </div>
      </div>
    </li>
  )
}

export default function Feeds() {
  return (
    <section className="w-full overflow-x-auto hide-scrollbar">
      <ul className="w-full flex gap-0.5 relative">
        {TOKENS.map((token) => (
          <FeedItem key={token.symbol} token={token} />
        ))}
      </ul>
    </section>
  )
}
