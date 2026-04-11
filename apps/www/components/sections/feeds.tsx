'use client'

import { TOKENS } from '@/lib/constants'
import { useTokenStore } from '@/stores/token'
import { Token } from '@/types'

export default function Feeds() {
  const { setToken } = useTokenStore()

  const handleSelectToken = (token: Token) => {
    setToken(token)
  }

  return (
    <section className="w-full overflow-x-auto hide-scrollbar">
      <ul className="w-full flex gap-0.5 relative">
        {TOKENS.map((token, index) => (
          <li
            key={index}
            onClick={() => handleSelectToken(token)}
            className="font-druk text-lg flex flex-col hover:bg-white/10 cursor-pointer px-2.5 py-2 rounded-xl opacity-80 hover:opacity-100 transition-opacity"
          >
            <span className="leading-none">{token.symbol}/USD</span>
            <div className="flex gap-3">
              <span className="text-[10px] text-white/70">87,888</span>
              <span className="text-[10px] text-white/70">80%</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
