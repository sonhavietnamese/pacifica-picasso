import { Token } from '@/types'

export const PACIFICA_API_BASE = 'https://test-api.pacifica.fi/api/v1'
export const PACIFICA_API_ENDPOINTS = {
  CREATE_ORDER: `${PACIFICA_API_BASE}/orders/create`,
  CREATE_MARKET_ORDER: `${PACIFICA_API_BASE}/orders/create_market`,
  CREATE_STOP_ORDER: `${PACIFICA_API_BASE}/orders/stop/create`,
  GET_OPEN_ORDERS: `${PACIFICA_API_BASE}/orders`,
  GET_ACCOUNT: `${PACIFICA_API_BASE}/account`,
  /** Trade / fill history used for the Live sketchbook list (see GET with `account` query). */
  GET_TRADES_HISTORY: `${PACIFICA_API_BASE}/trades/history`,
  CANCEL_ORDER: `${PACIFICA_API_BASE}/orders/cancel`,
  CANCEL_STOP_ORDER: `${PACIFICA_API_BASE}/orders/stop/cancel`,
  CANCEL_ALL_ORDERS: `${PACIFICA_API_BASE}/orders/cancel_all`,
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
