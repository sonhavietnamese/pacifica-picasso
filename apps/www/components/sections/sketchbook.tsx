'use client'

import { CardSketch } from '../ui/card-sketch'

export function SectionSketchbook() {
  return (
    <section className="pt-2 p-0 relative h-full flex flex-col">
      <div className="flex flex-col mb-2">
        <h2 className="font-druk text-base text-white ml-1">Your Sketchbook</h2>
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
