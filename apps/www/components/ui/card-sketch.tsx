'use client'

import { cn } from '@/lib/utils'

type State = 'pending' | 'active'

interface CardSketchProps {
  state: State
}

export function CardSketch({ state = 'pending' }: CardSketchProps) {
  return (
    <li className="w-full bg-[#1B1B1B] p-2 rounded-xl relative cursor-pointer group opacity-60">
      {state != 'pending' && (
        <aside className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button className="bg-[#1B1B1B] rounded-lg p-1 px-1.5 border border-white/5 opacity-80 hover:opacity-100 transition-opacity duration-150">
            <span className="leading-none text-white/80 text-sm font-medium ">Close</span>
          </button>
        </aside>
      )}

      <aside className="absolute bottom-2 right-2 pr-1">
        <span className={cn('text-white text-sm font-druk', 'leading-none', state === 'pending' && 'text-[#fffffff]')}>
          $0
        </span>
      </aside>

      <div className="relative z-1 flex">
        {/* <aside className="absolute top-0 right-0 bg-black rounded-lg p-2 px-2.5">
          <span className="leading-none font-druk text-white text-sm">X3</span>
        </aside> */}

        <aside className="absolute top-0 right-0 bg-black rounded-lg p-2 px-2.5">
          <span className="leading-none text-white text-sm font-medium">Patient</span>
        </aside>

        <div className="w-[100px] h-[80px] p-2 rounded flex items-center justify-center bg-[#1E1E1E]">
          <figure className="w-full h-full aspect-square overflow-hidden">
            <svg
              className="w-full h-full"
              width="72"
              height="40"
              viewBox="0 0 72 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.3418 35.1045L10.7575 26.4481C15.1788 22.3833 17.3895 20.351 19.1852 20.7222C20.9809 21.0935 22.4564 24.401 25.4073 31.016C26.5768 33.6377 28.1591 35.9632 30.2972 37.3404C42.7711 45.3748 32.3682 -5.81598 44.8308 2.23617C46.2405 3.14701 47.4725 4.51235 48.5332 6.07121C52.198 11.4574 54.0304 14.1505 55.7411 14.2857C57.4518 14.4208 59.2639 12.4955 62.8879 8.64498L69.7615 1.3418"
                stroke="white"
                strokeWidth="2.68313"
                strokeLinecap="round"
              />
            </svg>
          </figure>
        </div>
      </div>
    </li>
  )
}
