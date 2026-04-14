import { TOKENS } from '@/lib/constants'
import { Token } from '@/types'
import { create } from 'zustand'

interface TokenStore {
  token: Token
  setToken: (token: Token) => void
}

export const useTokenStore = create<TokenStore>((set) => ({
  token: TOKENS[1],
  setToken: (token) => set({ token }),
}))
