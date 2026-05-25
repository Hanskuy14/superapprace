import { formatIDR } from './MetricsBar';

function StatusIndicator({ value, thresholds = { green: 70, yellow: 40 }, label }) {
  let color, bgColor, borderColor;
  if (value >= thresholds.green) {
    color = 'text-emerald-400'; bgColor = 'bg-emerald-500/10'; borderColor = 'border-emerald-500/30';
  } else if (value >= thresholds.yellow) {
    color = 'text-amber-400'; bgColor = 'bg-amber-500/10'; borderColor = 'border-amber-500/30';
  } else {
    color = 'text-red-400'; bgColor = 'bg-red-500/10'; borderColor = 'border-red-500/30';
  }
  return (
    <div className={`p-3 rounded-lg border ${bgColor} ${borderColor}`}>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-300">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{Math.round(value)}%</span>
      </div>
      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            value >= thresholds.green ? 'bg-emerald-500' :
            value >= thresholds.yellow ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function OperationsTab({ state, dispatch }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pricing Control */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">💰 Kontrol Tarif</h3>
        <p className="text-xs text-gray-500 mb-4">Atur tarif per km sesuai regulasi Kemenhub (Batas Bawah: Rp 2.000 — Batas Atas: Rp 5.000)</p>

        <div className="space-y-5">
          {/* Base Fare */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-300">Tarif Dasar per Km</label>
              <span className="text-sm font-mono text-emerald-400">Rp {state.baseFarePerKm.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1500"
              max="6000"
              step="100"
              value={state.baseFarePerKm}
              onChange={(e) => dispatch({ type: 'SET_FARE', value: Number(e.target.value) })}
              className="slider-input"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Rp 1.500 (Promo Gila)</span>
              <span>Rp 6.000 (Premium)</span>
            </div>
          </div>

          {/* Surge Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div>
              <span className="text-sm text-gray-300">Surge Pricing Otomatis</span>
              <p className="text-xs text-gray-500">Naikkan tarif saat driver supply rendah</p>
            </div>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SURGE' })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                state.surgeEnabled ? 'bg-emerald-500' : 'bg-gray-600'
              }`}
            >
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ left: state.surgeEnabled ? '26px' : '2px' }} />
            </button>
          </div>
          {state.surgeEnabled && (
            <div className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
              ⚡ Surge aktif: {state.surgeMultiplier.toFixed(1)}x multiplier saat ini
            </div>
          )}
        </div>
      </div>

      {/* Driver Commission */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">🏍️ Komisi Driver (Platform Cut)</h3>
        <p className="text-xs text-gray-500 mb-4">Persentase potongan platform dari setiap transaksi. Tinggi = untung besar, tapi driver kabur.</p>

        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-300">Platform Commission</label>
              <span className={`text-sm font-mono ${state.driverCommission > 25 ? 'text-red-400' : 'text-emerald-400'}`}>
                {state.driverCommission}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              step="1"
              value={state.driverCommission}
              onChange={(e) => dispatch({ type: 'SET_COMMISSION', value: Number(e.target.value) })}
              className="slider-input"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>10% (Driver Happy)</span>
              <span>35% (Max Profit)</span>
            </div>
          </div>

          {/* Driver Satisfaction */}
          <StatusIndicator
            value={state.driverSatisfaction}
            thresholds={{ green: 60, yellow: 35 }}
            label="Driver Satisfaction"
          />
          <p className="text-xs text-gray-500 -mt-2 px-1">
            {state.driverSatisfaction > 60 ? '😊 Driver puas dan loyal' :
             state.driverSatisfaction > 35 ? '😐 Mulai ada keluhan. Hati-hati!' : '😤 BAHAYA! Risiko mogok massal tinggi!'}
          </p>
        </div>
      </div>

      {/* Engineering Budget */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">⚙️ Budget Engineering</h3>
        <p className="text-xs text-gray-500 mb-4">Investasi infrastruktur server & dev team untuk menjaga app stability saat traffic naik.</p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-300">Monthly Engineering Budget</label>
              <span className="text-sm font-mono text-cyan-400">{formatIDR(state.engineeringBudget)}/bln</span>
            </div>
            <input
              type="range"
              min="1000000000"
              max="30000000000"
              step="1000000000"
              value={state.engineeringBudget}
              onChange={(e) => dispatch({ type: 'SET_ENG_BUDGET', value: Number(e.target.value) })}
              className="slider-input"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Rp 1M (Skeleton Crew)</span>
              <span>Rp 30M (Full Scale)</span>
            </div>
          </div>

          {/* App Stability */}
          <StatusIndicator
            value={state.appStability}
            thresholds={{ green: 75, yellow: 50 }}
            label="App Stability"
          />
          <p className="text-xs text-gray-500 -mt-2 px-1">
            Tech Points: {state.techPoints} | Services Active: {state.unlockedServices.length}
          </p>
        </div>
      </div>

      {/* Unit Economics */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">📊 Unit Economics</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2.5 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-400">Take Rate (Platform Cut)</span>
            <span className="text-sm font-mono text-emerald-400">{state.takeRate}%</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-400">Avg Wait Time</span>
            <span className={`text-sm font-mono ${state.averageWaitTime > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
              {state.averageWaitTime.toFixed(1)} menit
            </span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-400">Revenue/bulan</span>
            <span className="text-sm font-mono text-emerald-400">{formatIDR(state.revenue)}</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-400">EBITDA/bulan</span>
            <span className={`text-sm font-mono font-bold ${state.ebitda >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {state.ebitda >= 0 ? '+' : ''}{formatIDR(state.ebitda)}
            </span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-400">Consumer Satisfaction</span>
            <span className={`text-sm font-mono ${state.consumerSatisfaction > 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {Math.round(state.consumerSatisfaction)}%
            </span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-400">Driver Supply Ratio</span>
            <span className={`text-sm font-mono ${state.driverSupplyRatio >= 0.8 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(state.driverSupplyRatio * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-400">Consumer Retention</span>
            <span className={`text-sm font-mono ${state.consumerRetention > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {Math.round(state.consumerRetention)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
