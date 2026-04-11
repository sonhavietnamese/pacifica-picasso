import { cn } from '@/lib/utils'

interface PriceArrowIndicatorProps {
  direction: 'up' | 'down'
}

export function PriceArrowIndicator({ direction }: PriceArrowIndicatorProps) {
  const color = direction === 'up' ? '#1EFF00' : '#FF0000'

  return (
    <figure className={cn('w-4 h-4 flex items-center justify-center', direction === 'down' ? 'rotate-180' : '')}>
      <svg
        className="w-full h-full"
        width="18"
        height="14"
        viewBox="0 0 18 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.5 13.3636L-1.16829e-06 13.3636L9.7845 8.55388e-07L17.5 13.3636Z" fill={color} />
      </svg>
    </figure>
  )
}
