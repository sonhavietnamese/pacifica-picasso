import { create } from 'zustand'
import type { DrawLine } from './types'

/** Match on-chain canvas: oldest line dropped when over cap (FIFO) */
export const MAX_STORED_DRAW_LINES = 20

interface DrawLinesState {
  lines: DrawLine[]
  crossCounts: number[]
  /** Unix ms when cross count last increased — used to float that card to top */
  lastCrossAt: number[]

  addLine: (line: DrawLine) => void
  removeLine: (index: number) => void
  clearLines: () => void
  setCrossCount: (lineIndex: number, count: number) => void
  /** Replace lines + crosses from chain (e.g. page refresh) */
  hydrateFromChain: (lines: DrawLine[], crossCounts: number[]) => void
}

export const useDrawLinesStore = create<DrawLinesState>((set) => ({
  lines: [],
  crossCounts: [],
  lastCrossAt: [],

  addLine: (line) =>
    set((s) => {
      const lines = [...s.lines, line]
      const crossCounts = [...s.crossCounts, 0]
      const lastCrossAt = [...s.lastCrossAt, 0]
      while (lines.length > MAX_STORED_DRAW_LINES) {
        lines.shift()
        crossCounts.shift()
        lastCrossAt.shift()
      }
      return { lines, crossCounts, lastCrossAt }
    }),

  removeLine: (index) =>
    set((s) => ({
      lines: s.lines.filter((_, i) => i !== index),
      crossCounts: s.crossCounts.filter((_, i) => i !== index),
      lastCrossAt: s.lastCrossAt.filter((_, i) => i !== index),
    })),

  clearLines: () => set({ lines: [], crossCounts: [], lastCrossAt: [] }),

  setCrossCount: (lineIndex, count) =>
    set((s) => {
      const prev = s.crossCounts[lineIndex] ?? 0
      const next = [...s.crossCounts]
      while (next.length <= lineIndex) next.push(0)
      next[lineIndex] = count
      const lastCrossAt = [...s.lastCrossAt]
      while (lastCrossAt.length <= lineIndex) lastCrossAt.push(0)
      if (count > prev) {
        lastCrossAt[lineIndex] = Date.now()
      }
      return { crossCounts: next, lastCrossAt }
    }),

  hydrateFromChain: (lines, crossCounts) => {
    const next = crossCounts.slice(0, lines.length)
    while (next.length < lines.length) next.push(0)
    const lastCrossAt = lines.map(() => 0)
    set({ lines, crossCounts: next, lastCrossAt })
  },
}))
