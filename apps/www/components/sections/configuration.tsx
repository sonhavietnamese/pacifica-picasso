'use client'

import { usePacificaAccount } from '@/hooks/use-pacifica-account'
import { usePrivy } from '@privy-io/react-auth'
import NumberFlow from '@number-flow/react'
import { DropdownMenu } from 'radix-ui'
import { useMemo, useState } from 'react'

export const RISKS = [1, 2, 3, 5, 8]
export const EXAMPLE_FUND = 120

export default function SectionConfiguration() {
  const [risk, setRisk] = useState(5)
  const { user } = usePrivy()

  const { data: account } = usePacificaAccount(user?.wallet?.address)

  const riskAmount = useMemo(() => {
    if (!account) return 0

    return Number(account.balance) * (risk / 100)
  }, [account, risk])

  return (
    <section className="p-4 rounded-xl bg-[#171717] mt-2 gap-2 flex flex-col">
      <div>
        <div id="title">
          <span className="font-druk text-white text-base leading-none">Config</span>
        </div>

        <div className="font-sans grid grid-cols-2 grid-rows-2 gap-1 mt-2">
          <div>
            <span className="text-white/70 text-sm">Risk per line</span>
          </div>

          <div className="flex items-center justify-end">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <button className="bg-black rounded-lg p-1.5 px-2 w-16 text-center cursor-pointer">
                  <span className="font-druk leading-none text-sm">{risk}%</span>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  side="bottom"
                  className="bg-black rounded-xl text-center cursor-pointer space-y-1 p-1 outline-none"
                  sideOffset={10}
                >
                  {RISKS.filter((r) => r !== risk).map((r) => (
                    <DropdownMenu.Item
                      className="bg-black rounded-lg p-2 px-3 text-center cursor-pointer font-druk leading-none text-sm text-white/70 hover:text-white hover:bg-white/10 outline-none"
                      key={r}
                      onClick={() => setRisk(r)}
                    >
                      {r}%
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          <div className=""></div>

          <div className="flex mr-1 flex-col">
            <span className="text-right text-white/70 text-sm mr-1">
              <NumberFlow prefix="~$" value={riskAmount}></NumberFlow>
            </span>
          </div>
        </div>
      </div>

      <div>
        <div id="title">
          <span className="font-druk text-white text-base leading-none">Brushes</span>
        </div>

        <div className="font-sans flex h-auto gap-2 mt-2">
          <div className="w-full h-full overflow-x-auto hide-scrollbar">
            <ul className="w-full h-full flex gap-1">
              {Array.from({ length: 10 }).map((_, index) => (
                <li key={index} className="inline-block relative cursor-pointer">
                  <button className="bg-white rounded-lg w-16 flex items-center justify-center aspect-square">
                    <figure className="w-10 aspect-square">
                      <svg
                        className="w-full h-full"
                        width="39"
                        height="39"
                        viewBox="0 0 39 39"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.79149 11.466C7.79149 9.43635 9.43599 7.79185 11.4656 7.79022H13.1377C14.1079 7.79022 15.0374 7.4051 15.7264 6.7226L16.8947 5.5526C18.3264 4.11285 20.6534 4.10635 22.0931 5.53797L22.0947 5.5396L22.1094 5.5526L23.2794 6.7226C23.9684 7.40672 24.8979 7.79022 25.868 7.79022H27.5385C29.5681 7.79022 31.2142 9.43472 31.2142 11.466V13.1348C31.2142 14.105 31.5977 15.0361 32.2819 15.7251L33.4519 16.8951C34.8916 18.3267 34.8997 20.6537 33.4681 22.0935L33.4665 22.0951L33.4519 22.1097L32.2819 23.2797C31.5977 23.9671 31.2142 24.8966 31.2142 25.8667V27.5388C31.2142 29.5685 29.5697 31.213 27.5401 31.213H27.5385H25.8647C24.8946 31.213 23.9635 31.5981 23.2761 32.2822L22.1061 33.4506C20.6761 34.8903 18.3507 34.8985 16.911 33.4701C16.9094 33.4685 16.9077 33.4668 16.9061 33.4652L16.8915 33.4506L15.7231 32.2822C15.0357 31.5981 14.1046 31.2146 13.1345 31.213H11.4656C9.43599 31.213 7.79149 29.5685 7.79149 27.5388V25.8635C7.79149 24.8933 7.40637 23.9638 6.72224 23.2765L5.55387 22.1065C4.11412 20.6765 4.10599 18.3511 5.53599 16.9113C5.53599 16.9097 5.53762 16.9081 5.53924 16.9065L5.55387 16.8918L6.72224 15.7218C7.40637 15.0328 7.79149 14.1033 7.79149 13.1316V11.466"
                          stroke="white"
                          strokeWidth="2.4375"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15.3262 23.6789L23.6787 15.3264"
                          stroke="white"
                          strokeWidth="2.4375"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M23.5552 23.5625H23.5698"
                          stroke="white"
                          strokeWidth="3.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15.4302 15.4375H15.4448"
                          stroke="white"
                          strokeWidth="3.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </figure>
                  </button>

                  <div className="absolute bottom-1 right-1 bg-black rounded items-center justify-center flex p-0.5 px-1">
                    <span className="font-druk text-[8px] mb-0.5">x10</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <button className="bg-black rounded-lg w-16 flex items-center justify-center aspect-square">
              <figure className="w-10 aspect-square">
                <svg
                  className="w-full h-full"
                  width="39"
                  height="39"
                  viewBox="0 0 39 39"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.79149 11.466C7.79149 9.43635 9.43599 7.79185 11.4656 7.79022H13.1377C14.1079 7.79022 15.0374 7.4051 15.7264 6.7226L16.8947 5.5526C18.3264 4.11285 20.6534 4.10635 22.0931 5.53797L22.0947 5.5396L22.1094 5.5526L23.2794 6.7226C23.9684 7.40672 24.8979 7.79022 25.868 7.79022H27.5385C29.5681 7.79022 31.2142 9.43472 31.2142 11.466V13.1348C31.2142 14.105 31.5977 15.0361 32.2819 15.7251L33.4519 16.8951C34.8916 18.3267 34.8997 20.6537 33.4681 22.0935L33.4665 22.0951L33.4519 22.1097L32.2819 23.2797C31.5977 23.9671 31.2142 24.8966 31.2142 25.8667V27.5388C31.2142 29.5685 29.5697 31.213 27.5401 31.213H27.5385H25.8647C24.8946 31.213 23.9635 31.5981 23.2761 32.2822L22.1061 33.4506C20.6761 34.8903 18.3507 34.8985 16.911 33.4701C16.9094 33.4685 16.9077 33.4668 16.9061 33.4652L16.8915 33.4506L15.7231 32.2822C15.0357 31.5981 14.1046 31.2146 13.1345 31.213H11.4656C9.43599 31.213 7.79149 29.5685 7.79149 27.5388V25.8635C7.79149 24.8933 7.40637 23.9638 6.72224 23.2765L5.55387 22.1065C4.11412 20.6765 4.10599 18.3511 5.53599 16.9113C5.53599 16.9097 5.53762 16.9081 5.53924 16.9065L5.55387 16.8918L6.72224 15.7218C7.40637 15.0328 7.79149 14.1033 7.79149 13.1316V11.466"
                    stroke="white"
                    strokeWidth="2.4375"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.3262 23.6789L23.6787 15.3264"
                    stroke="white"
                    strokeWidth="2.4375"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23.5552 23.5625H23.5698"
                    stroke="white"
                    strokeWidth="3.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.4302 15.4375H15.4448"
                    stroke="white"
                    strokeWidth="3.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </figure>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
