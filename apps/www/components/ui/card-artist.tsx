'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

type Texture = 'green' | 'red' | 'blue' | 'none'

interface CardArtistProps {
  image: string
  name: string
  percentage: number
  texture: Texture
}

export function CardArtist({
  image = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1DeMixahH_UASX3eve64UhSLvjHTePw8SIg&s',
  name = 'some_one.sol',
  percentage = 100,
  texture = 'green',
}: CardArtistProps) {
  return (
    <li className="w-full bg-[#1B1B1B] p-2 rounded-xl relative overflow-hidden">
      <div
        className={cn(
          'before:content-[""] before:z-0 before:opacity-90 before:absolute before:inset-0  before:bg-cover before:bg-center',
          texture === 'green' && 'before:bg-[url("/textures/green-001.png")]',
          texture === 'red' && 'before:bg-[url("/textures/red-001.png")]',
          texture === 'blue' && 'before:bg-[url("/textures/blue-001.png")]',
          texture === 'none' && 'before:bg-transparent'
        )}
      ></div>
      <div className="relative z-1">
        <figure className="w-12 aspect-square overflow-hidden rounded-xl border-3">
          <Image src={image} alt="Artist" width={100} height={100} className="w-full h-full object-cover" />
        </figure>
        <figure></figure>
      </div>
      <div className="flex items-center justify-between mt-2 px-1 pr-0 relative z-1">
        <span className="text-white text-base font-druk">{name}</span>
        <span
          className={cn(
            'text-black/90 text-sm font-druk p-0.5 px-2.5 bg-white/80 rounded-lg',
            texture === 'none' && 'text-white/90 bg-[#403F3F]',
            texture === 'red' && 'text-white/90 bg-black/80'
          )}
        >
          {percentage}%
        </span>
      </div>
    </li>
  )
}
