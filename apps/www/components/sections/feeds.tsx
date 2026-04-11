export default function Feeds() {
  return (
    <section className="w-full overflow-x-auto hide-scrollbar">
      <ul className="w-full flex gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <li
            key={index}
            className="font-druk text-lg flex flex-col hover:bg-white/10 cursor-pointer px-2.5 py-2 rounded-xl opacity-80 hover:opacity-100 transition-opacity"
          >
            <span className="leading-none">SOL/USD</span>
            <div className="flex gap-3">
              <span className="text-[10px] text-white/70">87,888</span>
              <span className="text-[10px] text-white/70">80%</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
