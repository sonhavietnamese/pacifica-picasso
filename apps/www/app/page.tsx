'use client'

import { Brand } from '@/components/brand'
import ConnectButton from '@/components/connect-button'
import { SectionArtists } from '@/components/sections/artists'
import { SectionChart } from '@/components/sections/chart'
import Feeds from '@/components/sections/feeds'
import SectionRight from '@/components/sections/right'
import { SectionSketchbook } from '@/components/sections/sketchbook'
import { usePrivy } from '@privy-io/react-auth'
import { AnimatePresence, motion } from 'motion/react'

export default function Page() {
  const { ready, authenticated } = usePrivy()

  if (!ready) return <div className="text-white">Loading...</div>

  return (
    <main className="w-screen h-screen p-2 overflow-hidden">
      <aside className="absolute top-2 right-2 z-10">
        <ConnectButton />
      </aside>

      <section className="w-full h-full grid grid-cols-[280px_1fr] gap-2 text-white">
        <section className="grid grid-rows-[auto_1fr] gap-2 w-full h-full overflow-hidden">
          <Brand />

          <div className="gap-2 h-full flex flex-col overflow-hidden">
            <div className="overflow-hidden">
              <SectionArtists />
            </div>

            <AnimatePresence>
              {authenticated && (
                <motion.div className="  overflow-hidden" animate={{ height: 700 }} exit={{ height: 0 }}>
                  <SectionSketchbook />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section className="w-full h-full flex gap-2">
          <section className="w-full grid grid-rows-[auto_1fr] gap-2 relative">
            <Feeds />
            <section className="w-full h-full">
              <SectionChart />
            </section>
          </section>

          <SectionRight />
        </section>
      </section>

      {/* <Status /> */}
    </main>
  )
}
