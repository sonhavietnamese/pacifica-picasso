// import { SectionChart } from '@/components/section-chart'
// import { Status } from '@/components/sections/status'

'use client'

import { SectionChart } from '@/components/section-chart'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export default function Page() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <main className="w-screen h-screen p-2 overflow-hidden">
      <section className="w-full h-full grid grid-cols-[280px_1fr] gap-2 text-white">
        <section className="w-full h-full bg-red-200"></section>

        <section className="w-full h-full flex gap-2">
          <section className="w-full grid grid-rows-[auto_1fr] gap-2">
            <section className="w-full overflow-x-auto hide-scrollbar">
              <ul className="w-full flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <li
                    key={index}
                    className="font-druk text-xl flex flex-col hover:bg-white/10 cursor-pointer px-3 py-2 rounded-xl"
                  >
                    <span className="leading-none">SOL/USD</span>
                    <div className="flex gap-3">
                      <span className="text-xs text-white/70">87,888</span>
                      <span className="text-xs text-white/70">80%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="w-full h-full">
              <SectionChart />
            </section>
            {/* <button onClick={() => setIsOpen(!isOpen)}>Toggle</button> */}
          </section>

          <AnimatePresence>
            {isOpen && (
              <motion.section className="bg-red-400" animate={{ width: 290 }} exit={{ width: 0 }}>
                <motion.section exit={{ opacity: 0 }}>
                  <h1>Hello</h1>
                </motion.section>
              </motion.section>
            )}
          </AnimatePresence>
        </section>
      </section>

      {/* <Status /> */}
    </main>
  )
}
