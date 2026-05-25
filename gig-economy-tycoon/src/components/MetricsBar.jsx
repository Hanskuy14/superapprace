import { calculateCashRunway } from '../engine/simulation';
import { TERRITORIES } from '../engine/gameState';

function formatIDR(value) {
  if (Math.abs(value) >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (Math.abs(value) >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}Jt`;
  return `Rp ${value.toLocaleString()}`;
}

function TrendBadge({ value, suffix = '', invert = false }) {
  const isPositive = invert ? value < 0 : value > 0;
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
      isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
    }`}>
      {value > 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

export default function MetricsBar({ state }) {
  const runway = calculateCashRunway(state);
  const territory = TERRITORIES.find(t => t.id === state.currentTerritory);

  const metrics = [
    {
      label: 'MAU',
      value: state.mau >= 1_000_000 ? `${(state.mau / 1_000_000).toFixed(2)}M` : `${(state.mau / 1_000).toFixed(1)}K`,
      trend: state.mauGrowthRate * 100,
      trendSuffix: '%',
    },
    {
      label: 'Market Share',
      value: `${state.marketShare}%`,
      trend: state.marketShare - 5, // vs starting
      trendSuffix: 'pp',
    },
    {
      label: 'Driver Fleet',
      value: state.activeDrivers.toLocaleString(),
      subtext: `Supply: ${(state.driverSupplyRatio * 100).toFixed(0)}%`,
    },
    {
      label: 'Burn Rate/mo',
      value: formatIDR(state.burnRate),
      trend: -state.burnRate / 1_000_000_000,
      trendSuffix: '',
      invert: true,
    },
    {
      label: 'Cash',
      value: formatIDR(state.cash),
      subtext: `Runway: ${runway >= 999 ? '∞' : runway + ' bln'}`,
      danger: runway < 4,
    },
    {
      label: 'App Stability',
      value: `${Math.round(state.appStability)}%`,
      danger: state.appStability < 60,
    },
  ];

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

      {/* Metrics Grid */}
      <div className="grid grid-cols-6 gap-2 p-2">
        {metrics.map((m, i) => (
          <div key={i} className={`metric-card ${m.danger ? 'border-red-500/50 animate-pulse' : ''}`}>
            <span className="text-xs text-gray-500 uppercase tracking-wider">{m.label}</span>
            <span className="text-lg font-bold text-white">{m.value}</span>
            <div className="flex items-center gap-1">
              {m.trend !== undefined && <TrendBadge value={m.trend} suffix={m.trendSuffix} invert={m.invert} />}
              {m.subtext && <span className="text-xs text-gray-500">{m.subtext}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { formatIDR };
