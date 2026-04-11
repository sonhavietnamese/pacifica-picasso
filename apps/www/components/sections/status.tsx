export function Status() {
  return (
    <section className="w-full fixed bottom-0 z-10 text-white font-sans p-2 px-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          <span className="text-white/70">Pacifica Connected</span>
        </div>
        <div className="flex items-center text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          <span className="text-white/70">Network Connected</span>
        </div>
      </div>
    </section>
  )
}
