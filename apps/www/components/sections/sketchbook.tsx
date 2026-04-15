'use client'

import { usePacificaOpenOrders } from '@/hooks/use-pacifica-open-orders'
import { cn } from '@/lib/utils'
import { useSketchbook as useSketchbookStore } from '@/stores/sketchbook'
import { usePrivy } from '@privy-io/react-auth'
import SectionHistory from './history'
import SectionLivePosition from './live-position'
import SectionOrders from './orders'
import useSketchbook from '@/hooks/use-sketchbook'
import { usePacificaPositions } from '@/hooks/use-pacifica-positions'
import { usePacificaTradeHistory } from '@/hooks/use-pacifica-trade-history'

export function SectionSketchbook() {
  const tab = useSketchbookStore((state) => state.tab)
  const setTab = useSketchbookStore((state) => state.setTab)
  const { user } = usePrivy()
  const address = user?.wallet?.address

  const {
    orders,
    isLoading: isOrdersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = usePacificaOpenOrders(address)

  const { livePositions, historyPositions } = useSketchbook(address)

  const { refetch: refetchLivePositions } = usePacificaPositions(address)
  const { refetch: refetchHistoryPositions } = usePacificaTradeHistory(address)

  const onChangeTab = (tab: 'live' | 'history' | 'orders') => {
    setTab(tab)

    if (tab === 'live') {
      refetchLivePositions()
    } else if (tab === 'history') {
      refetchHistoryPositions()
    } else if (tab === 'orders') {
      refetchOrders()
    }
  }

  const createStopOrder = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trade/orders/stop/create', {
      method: 'POST',
      body: JSON.stringify({
        wallet_id: user.wallet.id,
        symbol: 'BTC',
        side: 'bid',
        reduce_only: false,

        stop_price: '80100',
        limit_price: '80100',
      }),
    })

    const data = await response.json()
    console.log(data)
    void refetchOrders()
  }

  const cancelStopOrder = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trade/orders/stop/cancel', {
      method: 'POST',
      body: JSON.stringify({
        wallet_id: user.wallet.id,
        order_id: orders[0].order_id,
      }),
    })

    const data = await response.json()
    console.log(data)
    void refetchOrders()
  }

  const cancelAllOrders = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trade/orders/cancel_all', {
      method: 'POST',
      body: JSON.stringify({
        wallet_id: user.wallet.id,
        all_symbols: true,
      }),
    })

    const data = await response.json()
    console.log(data)
    void refetchOrders()
  }

  return (
    <section className="pt-2 p-0 relative h-full flex flex-col">
      <div className="flex flex-col mb-2">
        <h2 className="font-druk text-base text-white ml-1">Your Sketchbook</h2>
        <div className="bg-[#262626] w-fit p-1 rounded-xl mt-2 font-medium">
          <button
            onClick={() => onChangeTab('live')}
            className={cn(
              'text-white/70 px-2.5 p-2 bg-[#262626] rounded-lg',
              tab === 'live' && 'bg-[#171717] text-white'
            )}
          >
            Live
          </button>
          <button
            onClick={() => onChangeTab('history')}
            className={cn(
              'text-white/70 px-2.5 p-2 rounded-lg bg-[#262626] ',
              tab === 'history' && 'bg-[#171717] text-white'
            )}
          >
            History
          </button>
          <button
            onClick={() => onChangeTab('orders')}
            className={cn(
              'text-white/70 px-2.5 p-2 rounded-lg bg-[#262626] ',
              tab === 'orders' && 'bg-[#171717] text-white'
            )}
          >
            Orders
          </button>
        </div>
      </div>
      <div className="w-full h-full rounded-xl overflow-auto hide-scrollbar">
        {tab === 'live' ? (
          <SectionLivePosition positions={livePositions} />
        ) : tab === 'history' ? (
          <SectionHistory positions={historyPositions} />
        ) : tab === 'orders' ? (
          <SectionOrders orders={orders} isLoading={isOrdersLoading} error={ordersError} />
        ) : null}
      </div>

      <div className="flex ">
        <button className="bg-yellow-500 text-white px-4 py-2 rounded-md" onClick={createStopOrder}>
          Create Order
        </button>

        <button className="bg-yellow-500 text-white px-4 py-2 rounded-md" onClick={cancelAllOrders}>
          Cancel Order
        </button>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded-md" onClick={cancelStopOrder}>
          Cancel Stop Order
        </button>
      </div>
    </section>
  )
}
