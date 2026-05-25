import { formatIDR } from './MetricsBar';

export default function MarketingTab({ state, dispatch }) {
  const totalMarketingBurn = state.consumerVoucherBudget + state.driverLoyaltyPool + (state.prCampaignActive ? state.prCampaignCost : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Consumer Voucher Budget */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">🎫 Budget Cashback & Voucher</h3>
        <p className="text-xs text-gray-500 mb-4">
          Bakar uang untuk akuisisi user baru. Semakin besar budget, semakin cepat growth — tapi cash runway menipis.
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-300">Monthly Voucher Budget</label>
              <span className="text-sm font-mono text-amber-400">{formatIDR(state.consumerVoucherBudget)}/bln</span>
            </div>
            <input
              type="range"
              min="0"
              max="50000000000"
              step="1000000000"
              value={state.consumerVoucherBudget}
              onChange={(e) => dispatch({ type: 'SET_VOUCHER_BUDGET', value: Number(e.target.value) })}
              className="slider-input"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Rp 0 (No Promo)</span>
              <span>Rp 50M (Bakar Habis)</span>
            </div>
          </div>

          {/* Effectiveness Preview */}
          <div className="p-3 bg-gray-800 rounded-lg">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Estimated Growth Impact</span>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                  style={{ width: `${Math.min(100, (state.consumerVoucherBudget / 50_000_000_000) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-amber-400">
                +{Math.min(15, (state.consumerVoucherBudget / 50_000_000_000 * 15)).toFixed(1)}% growth
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">⚠️ Diminishing returns setelah Rp 20M/bulan</p>
          </div>
        </div>
      </div>

      {/* Driver Loyalty Pool */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">🏍️ Driver Loyalty Bonus Pool</h3>
        <p className="text-xs text-gray-500 mb-4">
          Bonus untuk top-performing drivers. Mencegah mereka pindah ke kompetitor.
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-300">Monthly Bonus Pool</label>
              <span className="text-sm font-mono text-cyan-400">{formatIDR(state.driverLoyaltyPool)}/bln</span>
            </div>
            <input
              type="range"
              min="0"
              max="30000000000"
              step="500000000"
              value={state.driverLoyaltyPool}
              onChange={(e) => dispatch({ type: 'SET_DRIVER_POOL', value: Number(e.target.value) })}
              className="slider-input"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Rp 0 (No Bonus)</span>
              <span>Rp 30M (Ultra Generous)</span>
            </div>
          </div>

          {/* Driver attraction effect */}
          <div className="p-3 bg-gray-800 rounded-lg">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Driver Retention Effect</span>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, (state.driverLoyaltyPool / 30_000_000_000) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-cyan-400">
                +{Math.min(30, (state.driverLoyaltyPool / 30_000_000_000 * 30)).toFixed(0)}% retention
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PR Campaign */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">📢 Kampanye PR Agresif</h3>
        <p className="text-xs text-gray-500 mb-4">
          Kampanye untuk poach driver dari kompetitor + brand awareness di media.
        </p>

        <div className={`p-4 rounded-lg border ${
          state.prCampaignActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 bg-gray-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-white">
                {state.prCampaignActive ? '🟢 KAMPANYE AKTIF' : '⚪ Kampanye Nonaktif'}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Biaya: {formatIDR(state.prCampaignCost)}/bulan | Efek: +5% driver poach rate
              </p>
            </div>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_PR_CAMPAIGN' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                state.prCampaignActive
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {state.prCampaignActive ? 'Stop Campaign' : 'Launch Campaign'}
            </button>
          </div>
        </div>
      </div>

      {/* Burn Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">🔥 Total Bakar Uang (Marketing)</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
            <span className="text-sm text-gray-400">Consumer Vouchers</span>
            <span className="text-sm font-mono text-amber-400">{formatIDR(state.consumerVoucherBudget)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
            <span className="text-sm text-gray-400">Driver Bonus Pool</span>
            <span className="text-sm font-mono text-cyan-400">{formatIDR(state.driverLoyaltyPool)}</span>
          </div>
          {state.prCampaignActive && (
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
              <span className="text-sm text-gray-400">PR Campaign</span>
              <span className="text-sm font-mono text-purple-400">{formatIDR(state.prCampaignCost)}</span>
            </div>
          )}
          <div className="border-t border-gray-700 pt-2">
            <div className="flex justify-between items-center p-2 bg-red-500/10 rounded border border-red-500/30">
              <span className="text-sm font-medium text-red-400">TOTAL MARKETING BURN</span>
              <span className="text-sm font-mono font-bold text-red-400">{formatIDR(totalMarketingBurn)}/bln</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>💡</span>
            <span>Tips: Seimbangkan growth vs sustainability. VC suka growth, tapi jangan sampai cash habis sebelum next round!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
