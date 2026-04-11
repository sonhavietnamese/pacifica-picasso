'use client'

import { CardArtist } from '../ui/card-artist'

export function SectionSketchbook() {
  return (
    <section className="pt-2 p-0 relative h-full flex flex-col">
      <div className="flex flex-col mb-2">
        <h2 className="font-druk text-base text-white ml-1">Your Sketchbook</h2>
      </div>
      <div className="w-full h-full rounded-xl overflow-auto hide-scrollbar">
        <ul className="w-full h-full rounded-xl space-y-2">
          <CardArtist
            image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1DeMixahH_UASX3eve64UhSLvjHTePw8SIg&s"
            name="bob_ng"
            percentage={100}
            texture="green"
          />

          <CardArtist
            image="https://s.yimg.com/os/en/newsfile_64/c37dcc6ae004ff9f7ed28ec13c5e911e"
            name="cat_boy.sol"
            percentage={90}
            texture="blue"
          />

          <CardArtist
            image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREs71_MrOHuI0O7o8xiTdWKLs6eJo5YYvWAw&s"
            name="lizzy"
            percentage={70}
            texture="red"
          />

          <CardArtist
            image="https://media1.tenor.com/m/cRTQk6N_FxMAAAAC/swag-cat-swagbilli-cutecat-cats-cat-swag-ok-yooo-yo.gif"
            name="swaggy"
            percentage={50}
            texture="none"
          />

          <CardArtist
            image="https://pbs.twimg.com/profile_images/1990816563864219648/G83GTyW1_400x400.jpg"
            name="bob_ng"
            percentage={20}
            texture="none"
          />

          {/* <div className="w-full h-px"></div> */}
        </ul>
      </div>

      {/* <figure className="w-full h-auto absolute bottom-0 left-0 z-10">
        <svg
          className="w-full h-full"
          width="320"
          height="134"
          viewBox="0 0 320 134"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="320" height="134" fill="url(#paint0_linear_111_408)" />
          <defs>
            <linearGradient id="paint0_linear_111_408" x1="160" y1="0" x2="160" y2="134" gradientUnits="userSpaceOnUse">
              <stop stopColor="#121212" stopOpacity="0" />
              <stop offset="0.278846" stopColor="#121212" stopOpacity="0.4" />
              <stop offset="0.836538" stopColor="#121212" />
            </linearGradient>
          </defs>
        </svg>
      </figure> */}
    </section>
  )
}
