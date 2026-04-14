import { create } from 'zustand'

type Tab = 'live' | 'history' | 'orders'

interface SketchbookStore {
  tab: Tab
  setTab: (tab: Tab) => void
}

export const useSketchbook = create<SketchbookStore>((set) => ({
  tab: 'live',
  setTab: (tab) => set({ tab }),
}))
