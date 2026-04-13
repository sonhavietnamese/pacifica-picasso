'use client'

import { cn } from '@/lib/utils'
import { useSketchbook } from '@/stores/sketchbook'
import { CardSketch } from '../ui/card-sketch'

export function SectionSketchbook() {
  const tab = useSketchbook((state) => state.tab)
  const setTab = useSketchbook((state) => state.setTab)

  return (
    <section className="pt-2 p-0 relative h-full flex flex-col">
      <div className="flex flex-col mb-2">
        <h2 className="font-druk text-base text-white ml-1">Your Sketchbook</h2>
        <div className="bg-[#262626] w-fit p-1 rounded-xl mt-2 font-medium">
          <button
            onClick={() => setTab('live')}
            className={cn(
              'text-white/70 px-2.5 p-2 bg-[#262626] rounded-lg',
              tab === 'live' && 'bg-[#171717] text-white'
            )}
          >
            Live
          </button>
          <button
            onClick={() => setTab('history')}
            className={cn(
              'text-white/70 px-2.5 p-2 rounded-lg bg-[#262626] ',
              tab === 'history' && 'bg-[#171717] text-white'
            )}
          >
            History
          </button>
        </div>
      </div>
      <div className="w-full h-full rounded-xl overflow-auto hide-scrollbar">
        {/* <div className="flex items-center gap-2 flex-col opacity-50 w-full h-full justify-center">
          <span className="text-white text-sm">No drawings yet</span>
        </div> */}

        <ul className="w-full h-full rounded-xl space-y-2">
          <CardSketch state="pending" />
        </ul>
      </div>
    </section>
  )
}
