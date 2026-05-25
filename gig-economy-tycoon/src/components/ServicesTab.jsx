import { SERVICES } from '../engine/gameState';
import { formatIDR } from './MetricsBar';

export default function ServicesTab({ state, dispatch }) {
  return (
    <div className="space-y-6">
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

      {/* Active Services Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">📈 Active Service Performance</h3>
        <div className="space-y-2">
          {state.unlockedServices.map(sId => {
            const svc = SERVICES.find(s => s.id === sId);
            if (!svc) return null;
            return (
              <div key={sId} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{svc.icon}</span>
                  <div>
                    <span className="text-sm font-medium text-white">{svc.name}</span>
                    <p className="text-xs text-gray-500">Revenue contribution: +{((svc.revenueMultiplier - 1) * 30).toFixed(0)}%</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">LIVE</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
