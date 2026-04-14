import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDiscordAvatar(userId: string, avatar: string) {
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.webp?size=96`
}

export function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys)
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const sortedKeys = Object.keys(obj).sort()
    const sortedObj: Record<string, unknown> = {}
    for (const key of sortedKeys) {
      sortedObj[key] = sortJsonKeys(obj[key])
    }
    return sortedObj
  }
  return value
}

export function prepareMessage(
  header: { type: string; timestamp: number; expiry_window: number },
  payload: Record<string, unknown>
): string {
  const data = {
    ...header,
    data: payload,
  }
  const sorted = sortJsonKeys(data) as Record<string, unknown>
  return JSON.stringify(sorted)
}

export function roundPriceDirection(rawPrice: number): number {
  return Math.round(rawPrice * 10) / 10
}

export function formatPrice(number: number) {
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatTradePnl(pnl: string) {
  const n = Number.parseFloat(pnl)
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return '$0'
  const sign = n > 0 ? '+' : '-'
  return `${sign}$${formatPrice(Math.abs(n))}`
}
