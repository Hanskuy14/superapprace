import { SERVICES } from '../engine/gameState';
import { formatIDR } from './MetricsBar';

function ServiceProfitCard({ perf }) {
  if (!perf) return null;
  const isPositive = perf.profit >= 0;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isPositive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{perf.icon}</span>
        <div>
          <span className="text-sm font-medium text-white">{perf.name}</span>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-500">Rev: <span className="text-emerald-400 font-mono">{formatIDR(perf.revenue)}</span></span>
            <span className="text-xs text-gray-500">Cost: <span className="text-red-400 font-mono">{formatIDR(perf.cost)}</span></span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-sm font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{formatIDR(perf.profit)}/mo
        </span>
        <div className="mt-0.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isPositive ? '💰 Cash Cow' : '🔥 Burning'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ServicesTab({ state, dispatch }) {
  const hasPerformanceData = Object.keys(state.servicePerformance || {}).length > 0;

  return (
    <div className="space-y-6">
      {/* Sub-Service Performance Breakdown (NEW) */}
      {hasPerformanceData && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">📊 Service P&L Breakdown</h3>
              <p className="text-xs text-gray-500">Which service is your cash cow vs. which one is burning money?</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Total Revenue</span>
              <p className="text-sm font-bold text-emerald-400 font-mono">{formatIDR(state.revenue)}/mo</p>
            </div>
          </div>

          {/* Performance Cards */}
          <div className="space-y-2">
            {Object.entries(state.servicePerformance).map(([sId, perf]) => (
              <ServiceProfitCard key={sId} perf={perf} />
            ))}
          </div>

          {/* Summary Bar */}
          {Object.keys(state.servicePerformance).length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 font-medium">Revenue Distribution</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden flex">
                {Object.entries(state.servicePerformance).map(([sId, perf], idx) => {
                  const totalRev = Object.values(state.servicePerformance).reduce((sum, p) => sum + p.revenue, 0);
                  const pct = totalRev > 0 ? (perf.revenue / totalRev) * 100 : 0;
                  const colors = ['bg-emerald-500', 'bg-cyan-500', 'bg-amber-500', 'bg-purple-500', 'bg-blue-500', 'bg-pink-500'];
                  return (
                    <div
                      key={sId}
                      className={`${colors[idx % colors.length]} flex items-center justify-center text-[9px] text-white font-bold transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${perf.name}: ${pct.toFixed(1)}%`}
                    >
                      {pct > 12 ? `${perf.icon} ${pct.toFixed(0)}%` : pct > 6 ? perf.icon : ''}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {Object.entries(state.servicePerformance).map(([sId, perf], idx) => {
                  const colors = ['text-emerald-400', 'text-cyan-400', 'text-amber-400', 'text-purple-400', 'text-blue-400', 'text-pink-400'];
                  return (
                    <span key={sId} className={`text-[10px] ${colors[idx % colors.length]}`}>
                      {perf.icon} {perf.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service Tree */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">🚀 Super-App Service Tree</h3>
        <p className="text-xs text-gray-500 mb-4">
          Unlock layanan baru untuk meningkatkan revenue stream. Setiap layanan menambah kompleksitas operasional.
        </p>

        <div className="flex items-center gap-4 mb-6 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">💰 Cash:</span>
            <span className="text-sm font-mono text-emerald-400">{formatIDR(state.cash)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">🔧 Tech Points:</span>
            <span className="text-sm font-mono text-cyan-400">{state.techPoints}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">📦 Active Services:</span>
            <span className="text-sm font-mono text-purple-400">{state.unlockedServices.length}/{SERVICES.length}</span>
          </div>
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((service, index) => {
            const isUnlocked = state.unlockedServices.includes(service.id);
            const canAfford = state.cash >= service.unlockCost && state.techPoints >= service.techPoints;
            const prevUnlocked = index === 0 || state.unlockedServices.includes(SERVICES[index - 1]?.id);
            const perf = state.servicePerformance?.[service.id];

            return (
              <div
                key={service.id}
                className={`relative p-4 rounded-lg border transition-all ${
                  isUnlocked
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : canAfford && prevUnlocked
                    ? 'border-cyan-500/50 bg-cyan-500/5 hover:border-cyan-400'
                    : 'border-gray-700 bg-gray-800/50 opacity-60'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {isUnlocked ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">✓ AKTIF</span>
                  ) : !prevUnlocked ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600/50 text-gray-500">🔒 LOCKED</span>
                  ) : null}
                </div>

                <div className="text-3xl mb-2">{service.icon}</div>
                <h4 className="font-bold text-white text-sm">{service.name}</h4>
                <p className="text-xs text-gray-400 mt-1 mb-3">{service.description}</p>

                {/* Live P&L for unlocked services */}
                {isUnlocked && perf && (
                  <div className={`mb-3 p-2 rounded border ${
                    perf.isProfitable ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <span className={`text-xs font-bold font-mono ${perf.isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                      {perf.isProfitable ? '+' : ''}{formatIDR(perf.profit)}/mo
                    </span>
                  </div>
                )}

                {!isUnlocked && (
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Biaya Unlock:</span>
                      <span className={state.cash >= service.unlockCost ? 'text-emerald-400' : 'text-red-400'}>
                        {formatIDR(service.unlockCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Tech Points:</span>
                      <span className={state.techPoints >= service.techPoints ? 'text-emerald-400' : 'text-red-400'}>
                        {service.techPoints} pts
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Revenue Mult:</span>
                    <span className="text-emerald-400">+{((service.revenueMultiplier - 1) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Complexity Load:</span>
                    <span className="text-amber-400">{service.complexityLoad.toFixed(1)}x</span>
                  </div>
                </div>

                {!isUnlocked && prevUnlocked && (
                  <button
                    onClick={() => dispatch({ type: 'UNLOCK_SERVICE', serviceId: service.id })}
                    disabled={!canAfford}
                    className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      canAfford
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? '🔓 Unlock Sekarang' : '❌ Belum Cukup'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
