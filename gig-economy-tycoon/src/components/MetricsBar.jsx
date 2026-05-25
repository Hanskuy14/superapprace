import { calculateCashRunway } from '../engine/simulation';
import { TERRITORIES } from '../engine/gameState';

function formatIDR(value) {
  if (Math.abs(value) >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (Math.abs(value) >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}Jt`;
  return `Rp ${value.toLocaleString()}`;
}

function StatusBadge({ value, thresholds = { green: 70, yellow: 40 }, suffix = '%' }) {
  const color = value >= thresholds.green ? 'emerald' : value >= thresholds.yellow ? 'amber' : 'red';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-${color}-500/15 text-${color}-400 border border-${color}-500/30`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-${color}-400`} />
      {Math.round(value)}{suffix}
    </span>
  );
}

function StatusBadgeRaw({ value, thresholds, suffix = '%' }) {
  const numVal = typeof value === 'number' ? value : 0;
  const greenT = thresholds?.green ?? 70;
  const yellowT = thresholds?.yellow ?? 40;

  let colorClass, dotClass, bgClass, borderClass;
  if (numVal >= greenT) {
    colorClass = 'text-emerald-400';
    dotClass = 'bg-emerald-400';
    bgClass = 'bg-emerald-500/15';
    borderClass = 'border-emerald-500/30';
  } else if (numVal >= yellowT) {
    colorClass = 'text-amber-400';
    dotClass = 'bg-amber-400';
    bgClass = 'bg-amber-500/15';
    borderClass = 'border-amber-500/30';
  } else {
    colorClass = 'text-red-400';
    dotClass = 'bg-red-400';
    bgClass = 'bg-red-500/15';
    borderClass = 'border-red-500/30';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${bgClass} ${colorClass} border ${borderClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {Math.round(numVal)}{suffix}
    </span>
  );
}

export default function MetricsBar({ state }) {
  const runway = calculateCashRunway(state);
  const territory = TERRITORIES.find(t => t.id === state.currentTerritory);

  return (
    <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
      {/* Company Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black text-emerald-400">{state.companyName}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
            {territory?.name} • {territory?.type}
          </span>
          {state.isPublic && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-mono">
              {state.stockTicker} Rp {state.stockPrice.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {/* Market Sentiment Indicator */}
          {state.marketSentiment && state.marketSentiment.id !== 'neutral' && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              state.valuationMultiplier > 1
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              📊 {state.marketSentiment.name} ({state.valuationMultiplier}x)
            </span>
          )}
          <span className="text-gray-500">
            📅 Bulan {state.month}, {state.year}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            state.gamePhase === 'startup' ? 'bg-blue-500/20 text-blue-400' :
            state.gamePhase === 'growth' ? 'bg-amber-500/20 text-amber-400' :
            state.gamePhase === 'pre-ipo' ? 'bg-purple-500/20 text-purple-400' :
            'bg-emerald-500/20 text-emerald-400'
          }`}>
            {state.gamePhase === 'startup' ? '🌱 Startup' :
             state.gamePhase === 'growth' ? '🚀 Growth' :
             state.gamePhase === 'pre-ipo' ? '📈 Pre-IPO' :
             '🏛️ Public Co.'}
          </span>
        </div>
      </div>

      {/* === HERO METRICS: 3 Critical Numbers === */}
      <div className="grid grid-cols-3 gap-3 p-3">
        {/* Cash Balance - HERO */}
        <div className={`bg-gray-900 border rounded-xl p-4 flex flex-col items-center justify-center ${
          runway < 4 ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-gray-800'
        }`}>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Cash Balance</span>
          <span className={`text-2xl font-black mt-1 ${runway < 4 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {formatIDR(state.cash)}
          </span>
          <span className={`text-xs mt-1 ${runway < 6 ? 'text-amber-400' : 'text-gray-500'}`}>
            Runway: {runway >= 999 ? '∞ (Profitable!)' : `${runway} bulan`}
          </span>
        </div>

        {/* Market Share - HERO */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Market Share</span>
          <span className="text-2xl font-black text-white mt-1">{state.marketShare}%</span>
          <span className="text-xs text-gray-500 mt-1">
            MAU: {state.mau >= 1_000_000 ? `${(state.mau / 1_000_000).toFixed(2)}M` : `${(state.mau / 1_000).toFixed(1)}K`}
          </span>
        </div>

        {/* Runway (Months Left) - HERO */}
        <div className={`bg-gray-900 border rounded-xl p-4 flex flex-col items-center justify-center ${
          state.ebitda < 0 && runway < 6 ? 'border-amber-500/50' : 'border-gray-800'
        }`}>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Monthly EBITDA</span>
          <span className={`text-2xl font-black mt-1 ${state.ebitda >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {state.ebitda >= 0 ? '+' : ''}{formatIDR(state.ebitda)}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            {state.ebitda >= 0 ? '🟢 Profitable' : `🔴 Burning ${formatIDR(Math.abs(state.ebitda))}/mo`}
          </span>
        </div>
      </div>

      {/* === SECONDARY STATS: Status Badges with Grouped Panels === */}
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
        {/* Marketplace Equilibrium Cluster */}
        <div className="bg-gray-900/60 border border-gray-800/60 rounded-lg px-3 py-2">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Marketplace Equilibrium</span>
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500">Fare/km</span>
              <span className="text-xs font-mono text-white">Rp {state.baseFarePerKm.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500">Commission</span>
              <span className="text-xs font-mono text-white">{state.driverCommission}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500">Supply Ratio</span>
              <StatusBadgeRaw value={state.driverSupplyRatio * 100} thresholds={{ green: 80, yellow: 60 }} suffix="%" />
            </div>
          </div>
        </div>

        {/* Health Status Cluster */}
        <div className="bg-gray-900/60 border border-gray-800/60 rounded-lg px-3 py-2">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Platform Health</span>
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-gray-500">App Stability</span>
              <StatusBadgeRaw value={state.appStability} thresholds={{ green: 75, yellow: 50 }} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500">Driver Sat.</span>
              <StatusBadgeRaw value={state.driverSatisfaction} thresholds={{ green: 60, yellow: 35 }} />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500">Consumer Ret.</span>
              <StatusBadgeRaw value={state.consumerRetention} thresholds={{ green: 75, yellow: 55 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { formatIDR };
