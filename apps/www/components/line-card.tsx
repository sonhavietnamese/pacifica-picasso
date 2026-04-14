import { usePacificaPriceStream } from '@/hooks/use-pacifica-price-stream'
import { DrawLine } from '@/lib/linelive/types'
import { useCallback, useMemo } from 'react'

const CHECKPOINT_COUNT = 5

export function LineCard({ line }: { line: DrawLine }) {
  const onPriceUpdate = useCallback((price: number) => {
    console.log(price)
    console.log(Math.round(Date.now() / 1000))
  }, [])

  usePacificaPriceStream('SOL', onPriceUpdate)

  const normalizedTimeLine = useMemo(() => {
    return line.points.map((point) => {
      return {
        ...point,
        time: Math.round(point.time),
      }
    })
  }, [line.points])

  const bias = useMemo(() => {
    const firstPoint = line.points[0]
    const lastPoint = line.points[line.points.length - 1]

    const bias = lastPoint.value - firstPoint.value
    return bias > 0 ? 'Long' : bias < -0 ? 'Short' : 'Neutral'
  }, [line.points])

  const lowestPoint = useMemo(() => {
    return Math.min(...line.points.map((point) => point.value))
  }, [line.points])

  const highestPoint = useMemo(() => {
    return Math.max(...line.points.map((point) => point.value))
  }, [line.points])

  const relativeTimeCheckpoints = useMemo(() => {
    const earliestTime = Math.min(...normalizedTimeLine.map((point) => point.time))
    const latestTime = Math.max(...normalizedTimeLine.map((point) => point.time))

    const distance = Math.round((latestTime - earliestTime) / CHECKPOINT_COUNT)
    const timeCheckpoints = Array.from({ length: CHECKPOINT_COUNT }, (_, i) => earliestTime + distance * (i + 1))

    // remove the first and last timepoints
    const normalizedTimeCheckpoints = timeCheckpoints.slice(1, -1)

    // For each normalizedTimeCheckpoint, find the draw point with time closest to it
    const closestPoints = normalizedTimeCheckpoints.map((checkpoint) => {
      let minDist = Infinity
      let closest = null
      for (const point of normalizedTimeLine) {
        const dist = Math.abs(point.time - checkpoint)
        if (dist < minDist) {
          minDist = dist
          closest = point
        }
      }
      return closest
    })

    return closestPoints
  }, [normalizedTimeLine])

  console.log(relativeTimeCheckpoints)

  return (
    <div className="w-full bg-[#1B1B1B] p-2 rounded-xl flex flex-col relative cursor-pointer group">
      <span className="text-sm font-medium">{bias}</span>
      <div className="flex flex-col">
        <span>{lowestPoint}</span>
        <span>{highestPoint}</span>
      </div>
    </div>
  )
}
