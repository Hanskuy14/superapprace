export default function CrisisModal({ crisis, onResolve }) {
  if (!crisis) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="max-w-lg w-full bg-gray-900 border border-red-500/50 rounded-xl shadow-2xl shadow-red-500/10 overflow-hidden">
        {/* Header */}
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-4">
          <h2 className="text-xl font-black text-red-400">{crisis.title}</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-300 text-sm leading-relaxed mb-6">{crisis.description}</p>

          <div className="space-y-3">
            {/* Option A */}
            <button
              onClick={() => onResolve('A')}
              className="w-full p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/20">OPSI A</span>
              </div>
              <span className="text-sm text-white font-medium group-hover:text-cyan-300 transition-colors">
                {crisis.optionA.label}
              </span>
            </button>

            {/* Option B */}
            <button
              onClick={() => onResolve('B')}
              className="w-full p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/20">OPSI B</span>
              </div>
              <span className="text-sm text-white font-medium group-hover:text-amber-300 transition-colors">
                {crisis.optionB.label}
              </span>
            </button>
          </div>
        </div>

        {/* Footer Warning */}
        <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            ⚠️ Keputusan ini tidak bisa dibatalkan. Pilih dengan bijak — nasib startup Anda di tangan Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
