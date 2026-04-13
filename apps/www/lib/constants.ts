import { Token } from '@/types'

export const PACIFICA_API_BASE = 'https://test-api.pacifica.fi/api/v1'
export const PACIFICA_API_ENDPOINTS = {
  CREATE_ORDER: `${PACIFICA_API_BASE}/orders/create`,
  GET_OPEN_ORDERS: `${PACIFICA_API_BASE}/orders`,
  GET_ACCOUNT: `${PACIFICA_API_BASE}/account`,
}

export const PACIFICA_WS_URL = 'wss://test-ws.pacifica.fi/ws'

export const TOKENS: Token[] = [
  {
    symbol: 'BTC',
    color: '#F7931B',
  },
  {
    symbol: 'SOL',
    color: '#DB1FFF',
  },
  {
    symbol: 'TRUMP',
    color: '#D9B75E',
  },
  {
    symbol: 'XAU',
    color: '#E9BC3C',
  },
  {
    symbol: 'NVDA',
    color: '#266524',
  },
]
