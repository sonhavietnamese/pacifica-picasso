// import { SectionChart } from '@/components/section-chart'
// import { Status } from '@/components/sections/status'

'use client'

import ConnectButton from '@/components/connect-button'
import { SectionChart } from '@/components/sections/chart'
import { SectionArtists } from '@/components/sections/artists'
import Feeds from '@/components/sections/feeds'
import { cn } from '@/lib/utils'
import { usePrivy } from '@privy-io/react-auth'
import { AnimatePresence, motion } from 'motion/react'
import { SectionSketchbook } from '@/components/sections/sketchbook'
import { Brand } from '@/components/brand'

export default function Page() {
  const { ready, authenticated } = usePrivy()

  if (!ready) return <div className="text-white">Loading...</div>

  return (
    <main className="w-screen h-screen p-2 overflow-hidden">
      <section className="w-full h-full grid grid-cols-[280px_1fr] gap-2 text-white">
        <section className="grid grid-rows-[auto_1fr] gap-2 w-full h-full overflow-hidden">
          <Brand />

          <div className="gap-2 h-full flex flex-col overflow-hidden">
            <div className="overflow-hidden">
              <SectionArtists />
            </div>

            <div className="h-[700px] overflow-hidden">
              <SectionSketchbook />
            </div>
          </div>
        </section>

        <section className="w-full h-full flex gap-2">
          <section className="w-full grid grid-rows-[auto_1fr] gap-2 relative">
            <Feeds />
            <section className="w-full h-full">
              <SectionChart />

              <aside className="absolute bottom-2 right-2 z-10">
                <ConnectButton />
              </aside>
            </section>
          </section>

          <AnimatePresence>
            {authenticated && (
              <motion.section className="" animate={{ width: 320 }} exit={{ width: 0 }}>
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
