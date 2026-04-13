import { usePrivy } from '@privy-io/react-auth'
import { AnimatePresence, motion } from 'motion/react'
import SectionBeta from './beta'
import SectionConfiguration from './configuration'
import SectionProfile from './profile'

export default function SectionRight() {
  const { authenticated, user } = usePrivy()

  if (!user) return null

  return (
    <AnimatePresence>
      {authenticated && (
        <motion.section className="" initial={{ width: 0 }} animate={{ width: 320 }} exit={{ width: 0 }}>
          <motion.section
            transition={{ delay: 0.2 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col  h-full"
          >
            <SectionProfile user={user} />

            <SectionConfiguration />

            <section className="flex min-h-0 flex-1 flex-col">
              {/* <figure className="relative min-h-0 flex-1 w-full">
                <Image src="/panel.svg" alt="panel" fill className="object-contain object-center" sizes="100%" />
              </figure> */}
            </section>

            <SectionBeta />
          </motion.section>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
