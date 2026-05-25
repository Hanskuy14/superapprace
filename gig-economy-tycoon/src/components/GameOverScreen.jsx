import { formatIDR } from './MetricsBar';

export default function GameOverScreen({ state, onRestart }) {
  const totalMonths = (state.year - 2024) * 12 + state.month;

  // Calculate best performing service
  const bestService = Object.entries(state.servicePerformance || {}).sort((a, b) => b[1].profit - a[1].profit)[0];

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-gray-900 border border-red-500/30 rounded-xl p-8 text-center animate-fade-in">
        <div className="text-6xl mb-4">💀</div>
        <h1 className="text-3xl font-black text-red-400 mb-2">GAME OVER</h1>
        <p className="text-gray-400 mb-6">{state.gameOverReason}</p>

        <div className="bg-gray-800 rounded-lg p-5 mb-6 text-left space-y-2">
          <h3 className="text-sm font-bold text-gray-300 mb-3">📊 Final Stats — {state.companyName}</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Survived:</span>
            <span className="text-white font-mono">{totalMonths} bulan</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Peak MAU:</span>
            <span className="text-white font-mono">{state.mau.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Market Share:</span>
            <span className="text-white font-mono">{state.marketShare}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Raised:</span>
            <span className="text-white font-mono">{formatIDR(state.totalRaised)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Services Unlocked:</span>
            <span className="text-white font-mono">{state.unlockedServices.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Territories:</span>
            <span className="text-white font-mono">{state.unlockedTerritories.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Final Valuation:</span>
            <span className="text-emerald-400 font-mono">{formatIDR(state.valuation)}</span>
          </div>
          {bestService && (
            <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
              <span className="text-gray-500">Best Service:</span>
              <span className="text-cyan-400 font-mono">{bestService[1].icon} {bestService[1].name}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Final Net Flow:</span>
            <span className={`font-mono ${state.cashFlow.netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {state.cashFlow.netCashFlow >= 0 ? '+' : ''}{formatIDR(state.cashFlow.netCashFlow)}/mo
            </span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="btn-primary w-full text-lg py-3"
        >
          🔄 Mulai Lagi dari Awal
        </button>
      </div>
    </div>
  );
}
