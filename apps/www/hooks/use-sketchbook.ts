import { useDrawLinesStore } from '@/lib/linelive'

export default function useSketchbook() {
  const lines = useDrawLinesStore((state) => state.lines)

  return {}
}
