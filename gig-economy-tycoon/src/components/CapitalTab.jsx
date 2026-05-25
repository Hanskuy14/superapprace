import { FUNDING_ROUNDS, TERRITORIES } from '../engine/gameState';
import { formatIDR } from './MetricsBar';

export default function CapitalTab({ state, dispatch }) {
  const currentRound = FUNDING_ROUNDS[state.fundingRound];
  const ipoReady = state.marketShare >= 40 && state.unlockedServices.length >= 3 && state.revenue >= 50_000_000_000;

  return (
    <div className="space-y-6">
      {/* Funding Rounds */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">💰 Funding Rounds</h3>
        <p className="text-xs text-gray-500 mb-4">
          Raise capital dari VC untuk fuel growth. Setiap round mendilusi equity founder.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FUNDING_ROUNDS.map((round, index) => {
            const isCompleted = index < state.fundingRound;
            const isCurrent = index === state.fundingRound;
            const isLocked = index > state.fundingRound;
            const canRaise = isCurrent && state.mau >= round.requiredMAU;

            return (
              <div
                key={round.id}
                className={`p-4 rounded-lg border transition-all ${
                  isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' :
                  isCurrent ? 'border-cyan-500/50 bg-cyan-500/5' :
                  'border-gray-700 bg-gray-800/50 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-white">{round.name}</span>
                  {isCompleted && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">✓ CLOSED</span>}
                  {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">NEXT</span>}
                  {isLocked && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600/50 text-gray-500">🔒</span>}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Raise:</span>
                    <span className="text-emerald-400">{formatIDR(round.maxRaise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valuation:</span>
                    <span className="text-cyan-400">{formatIDR(round.targetValuation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dilution:</span>
                    <span className="text-red-400">-{round.dilution}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Required MAU:</span>
                    <span className={state.mau >= round.requiredMAU ? 'text-emerald-400' : 'text-red-400'}>
                      {round.requiredMAU > 0 ? `${(round.requiredMAU / 1000).toFixed(0)}K` : 'None'}
                    </span>
                  </div>
                </div>

                {isCurrent && (
                  <button
                    onClick={() => dispatch({ type: 'RAISE_FUNDING', roundIndex: index })}
                    disabled={!canRaise}
                    className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      canRaise
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canRaise ? '🤝 Pitch & Close Round' : `Need ${(round.requiredMAU / 1000).toFixed(0)}K MAU`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Equity & Valuation Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">📊 Cap Table & Equity</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-400">Founder Equity</span>
              <span className={`text-lg font-bold ${state.founderEquity > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {state.founderEquity}%
              </span>
            </div>
            
            {/* Equity bar visualization */}
            <div className="h-6 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${state.founderEquity}%` }}>
                {state.founderEquity > 15 ? `Founder ${state.founderEquity}%` : ''}
              </div>
              <div className="bg-purple-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${100 - state.founderEquity}%` }}>
                {100 - state.founderEquity > 15 ? `VC ${100 - state.founderEquity}%` : ''}
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-400">Current Valuation</span>
              <span className="text-lg font-bold text-cyan-400">{formatIDR(state.valuation)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-400">Total Raised</span>
              <span className="text-sm font-mono text-emerald-400">{formatIDR(state.totalRaised)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-400">Funding Round</span>
              <span className="text-sm font-mono text-purple-400">
                {state.fundingRound > 0 ? FUNDING_ROUNDS[state.fundingRound - 1]?.name : 'Pre-Seed'} ✓
              </span>
            </div>
          </div>
        </div>

        {/* IPO Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">🔔 IPO Milestone</h3>
          
          {state.isPublic ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                <span className="text-2xl">🏛️</span>
                <p className="text-emerald-400 font-bold mt-2">{state.companyName} is PUBLIC!</p>
                <p className="text-3xl font-black text-white mt-2">
                  {state.stockTicker} Rp {state.stockPrice.toLocaleString()}
                </p>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Kelola quarterly earnings untuk menjaga harga saham tetap naik.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-4">
                Untuk IPO, kamu perlu memenuhi semua syarat berikut:
              </p>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${state.marketShare >= 40 ? 'bg-emerald-500/10' : 'bg-gray-800'}`}>
                <span className={state.marketShare >= 40 ? 'text-emerald-400' : 'text-gray-500'}>
                  {state.marketShare >= 40 ? '✅' : '⬜'}
                </span>
                <div>
                  <span className="text-sm text-gray-300">Market Share ≥ 40%</span>
                  <p className="text-xs text-gray-500">Currently: {state.marketShare}%</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${state.unlockedServices.length >= 3 ? 'bg-emerald-500/10' : 'bg-gray-800'}`}>
                <span className={state.unlockedServices.length >= 3 ? 'text-emerald-400' : 'text-gray-500'}>
                  {state.unlockedServices.length >= 3 ? '✅' : '⬜'}
                </span>
                <div>
                  <span className="text-sm text-gray-300">Super-App Status (≥3 services)</span>
                  <p className="text-xs text-gray-500">Currently: {state.unlockedServices.length} services</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${state.revenue >= 50_000_000_000 ? 'bg-emerald-500/10' : 'bg-gray-800'}`}>
                <span className={state.revenue >= 50_000_000_000 ? 'text-emerald-400' : 'text-gray-500'}>
                  {state.revenue >= 50_000_000_000 ? '✅' : '⬜'}
                </span>
                <div>
                  <span className="text-sm text-gray-300">Monthly Revenue ≥ Rp 50M</span>
                  <p className="text-xs text-gray-500">Currently: {formatIDR(state.revenue)}</p>
                </div>
              </div>

              <button
                onClick={() => dispatch({ type: 'EXECUTE_IPO' })}
                disabled={!ipoReady}
                className={`w-full mt-4 py-3 rounded-lg text-base font-bold transition-all ${
                  ipoReady
                    ? 'bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white animate-pulse'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {ipoReady ? '🔔 RING THE BELL — GO PUBLIC!' : '🔒 IPO Requirements Not Met'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Territory Expansion */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">🌏 Geographic Expansion</h3>
        <p className="text-xs text-gray-500 mb-4">
          Ekspansi ke teritori baru. Market share akan reset ke 5% — bersiap untuk perang baru!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {TERRITORIES.filter(t => t.id !== state.currentTerritory).map(territory => {
            const isUnlocked = state.unlockedTerritories.includes(territory.id);
            const canUnlock = state.cash >= territory.unlockCost && state.marketShare >= 30;

            return (
              <div
                key={territory.id}
                className={`p-3 rounded-lg border ${
                  isUnlocked ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-700 bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-white">{territory.name}</span>
                  {isUnlocked && <span className="text-xs text-emerald-400">✓</span>}
                </div>
                <span className="text-xs text-gray-500">{territory.type}</span>
                <div className="text-xs text-gray-400 mt-1">{(territory.population / 1_000_000).toFixed(1)}M pop</div>
                
                {!isUnlocked && (
                  <>
                    <div className="text-xs text-amber-400 mt-1">Cost: {formatIDR(territory.unlockCost)}</div>
                    <button
                      onClick={() => dispatch({ type: 'UNLOCK_TERRITORY', territoryId: territory.id })}
                      disabled={!canUnlock}
                      className={`w-full mt-2 py-1.5 rounded text-xs font-medium ${
                        canUnlock ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canUnlock ? 'Expand' : state.marketShare < 30 ? 'Need 30% Share' : 'Need Cash'}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
