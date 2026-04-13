import { formatAddress } from '@/lib/utils'
import Image from 'next/image'
import { usePrivy, User } from '@privy-io/react-auth'

interface SectionProfileProps {
  user: User
}

export default function SectionProfile({ user }: SectionProfileProps) {
  return (
    <section>
      <div className="w-full flex items-end justify-end">
        <div className="grid grid-cols-[auto_1fr] gap-2 p-2 rounded-xl cursor-pointer hover:bg-[#222222] w-fit px-2 text-right">
          <div className="flex flex-col items-end w-full justify-center gap-0.5">
            <span className="text-white/70 font-medium text-sm mr-1">{formatAddress(user.wallet?.address ?? '')}</span>
            <div className="flex items-center gap-1 leading-none p-1 bg-black w-fit rounded-lg pl-2">
              <figure className="w-5 aspect-square">
                <svg
                  className="w-full h-full"
                  width="30"
                  height="31"
                  viewBox="0 0 30 31"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.6157 10.0083H2.74807C2.2216 10.0083 2.04087 10.7094 2.50172 10.9639L10.6536 15.4661C10.8319 15.5645 10.9344 15.7596 10.9144 15.9622L9.72775 27.9701C9.67478 28.5062 10.3814 28.7471 10.6669 28.2903L17.0258 18.116C17.1086 17.9836 17.2476 17.8964 17.4029 17.8795L26.9905 16.8374C27.5085 16.7811 27.6181 16.0756 27.1416 15.8648L19.2437 12.3705C19.0593 12.289 18.9403 12.1063 18.9403 11.9046V2.7488C18.9403 2.24689 18.2912 2.04733 18.0093 2.46256L13.0373 9.78501C12.9424 9.92469 12.7845 10.0083 12.6157 10.0083Z"
                    stroke="url(#paint0_linear_227_243)"
                    strokeWidth="4.4683"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_227_243"
                      x1="6.63572"
                      y1="0.849253"
                      x2="24.8068"
                      y2="30.3773"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#D4BB9D" />
                      <stop offset="1" stopColor="#D5A468" />
                    </linearGradient>
                  </defs>
                </svg>
              </figure>

              <span className="text-white text-xs font-druk">12,345</span>
            </div>
          </div>

          <figure className="w-13 aspect-square items-center justify-center rounded-xl overflow-hidden border-2 border-white/80">
            <Image
              src="https://static.boredpanda.com/blog/wp-content/uploads/2025/10/funny-cat-memes-go-hard-cover_675.jpg"
              alt="Avatar"
              width={100}
              height={100}
              className="w-full h-full object-cover"
            />
          </figure>
        </div>
      </div>
    </section>
  )
}
