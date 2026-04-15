import { DrawLine, useDrawLinesStore } from '@/lib/linelive'
import { useEffect, useState } from 'react'
import { PacificaTradeHistoryRow, usePacificaTradeHistory } from './use-pacifica-trade-history'

export type LivePosition = {
  drawLine: DrawLine
  crossCount: number
}

export type HistoryPosition = PacificaTradeHistoryRow

export default function useSketchbook(address: string | undefined) {
  const [livePositions, setLivePositions] = useState<LivePosition[]>([])
  const [historyPositions, setHistoryPositions] = useState<HistoryPosition[]>([])

  const lines = useDrawLinesStore((state) => state.lines)
  const crossCounts = useDrawLinesStore((state) => state.crossCounts)

  const { data: historyData } = usePacificaTradeHistory(address, { limit: 50 })

  useEffect(() => {
    // const fetchLivePositions = async () => {
    //   const positions = await fetch('/api/sketchbook/live-positions')
    //   setLivePositions(positions)
    // }
    // fetchLivePositions()

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLivePositions(
      lines.map((line) => ({
        drawLine: line,
        crossCount: crossCounts[lines.indexOf(line)],
      }))
    )
  }, [lines, crossCounts])

  useEffect(() => {
    if (historyData) {
      // filter out all the position with the order_id or client_order_id not contain the word "picasso" in it
      const filteredHistoryPositions = historyData.pages
        .flatMap((page) => page.data)
        .filter((position) => {
          return position.order_id.toString().includes('picasso') || position.client_order_id.includes('picasso')
        })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistoryPositions(filteredHistoryPositions)
    }
  }, [historyData])

  return {
    livePositions,
    historyPositions,
  }
}
