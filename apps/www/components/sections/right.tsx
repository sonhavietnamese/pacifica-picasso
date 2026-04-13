'use client'

import { usePrivy } from '@privy-io/react-auth'
import { AnimatePresence, motion } from 'motion/react'
import SectionBeta from './beta'
import SectionConfiguration from './configuration'
import SectionProfile from './profile'
import SectionAccount from './account'

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

            <SectionAccount user={user} />

            <SectionBeta />
          </motion.section>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
