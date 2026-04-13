export default function SectionBeta() {
  return (
    <section className="p-4 rounded-xl bg-[#171717] mt-2 gap-2 flex flex-col">
      <div>
        <div id="title">
          <span className="font-druk text-white text-base leading-none">Beta*</span>
        </div>

        <div className="font-sans gap-1 mt-2">
          <div>
            <span className="text-white/70 text-sm leading-none">
              We are running beta test phase, willing to use test token to experience the app
            </span>
          </div>

          <div className="w-full mt-4">
            <button className="bg-white text-black rounded-xl py-3 px-2 text-center w-full font-druk leading-none">
              USDP Faucet
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
