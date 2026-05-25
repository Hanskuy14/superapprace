import { formatIDR } from './MetricsBar';

function FlowRow({ label, value, type = 'neutral', icon }) {
  const colorClass = type === 'inflow' ? 'text-emerald-400' : type === 'outflow' ? 'text-red-400' : 'text-white';
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-2">
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-sm text-gray-300">{label}</span>
      </div>
      <span className={`text-sm font-mono font-medium ${colorClass}`}>
        {type === 'inflow' ? '+' : type === 'outflow' ? '-' : ''}{formatIDR(Math.abs(value))}
      </span>
    </div>
  );
}

export default function CashFlowLedger({ state }) {
  const { cashFlow } = state;
  const isPositiveFlow = cashFlow.netCashFlow >= 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">📊 Arus Kas (Cash Flow)</h3>
          <p className="text-xs text-gray-500">Statement per bulan (Month {state.month}, {state.year})</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
          isPositiveFlow
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/15 border border-red-500/30 text-red-400'
        }`}>
          {isPositiveFlow ? '+ Net Inflow' : '- Net Burn'}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* INFLOWS */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Cash Inflow (+)</span>
            <div className="flex-1 h-px bg-emerald-500/20" />
          </div>
          <div className="space-y-0.5">
            <FlowRow
              label="Ride/Delivery Commissions (Take Rate)"
              value={cashFlow.inflow.rideCommissions}
              type="inflow"
              icon="🚗"
            />
            {cashFlow.inflow.fintechInterest > 0 && (
              <FlowRow
                label="FinTech Interest Income"
                value={cashFlow.inflow.fintechInterest}
                type="inflow"
                icon="💳"
              />
            )}
            {cashFlow.inflow.vcFunding > 0 && (
              <FlowRow
                label="VC Funding Injection"
                value={cashFlow.inflow.vcFunding}
                type="inflow"
                icon="🏦"
              />
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-800/50 flex justify-between px-2">
            <span className="text-xs font-medium text-gray-400">Total Inflow</span>
            <span className="text-sm font-mono font-bold text-emerald-400">+{formatIDR(cashFlow.inflow.totalInflow)}</span>
          </div>
        </div>

        {/* OUTFLOWS */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Cash Outflow (-)</span>
            <div className="flex-1 h-px bg-red-500/20" />
          </div>
          <div className="space-y-0.5">
            <FlowRow
              label="Consumer Subsidies/Vouchers"
              value={cashFlow.outflow.consumerSubsidies}
              type="outflow"
              icon="🎫"
            />
            <FlowRow
              label="Driver Loyalty Bonuses"
              value={cashFlow.outflow.driverBonuses}
              type="outflow"
              icon="🏍️"
            />
            <FlowRow
              label="Server Infrastructure Costs"
              value={cashFlow.outflow.serverCosts}
              type="outflow"
              icon="🖥️"
            />
            <FlowRow
              label="Engineering/Staff Salaries"
              value={cashFlow.outflow.staffSalaries}
              type="outflow"
              icon="👨‍💻"
            />
            <FlowRow
              label="Marketing Overhead"
              value={cashFlow.outflow.marketingOverhead}
              type="outflow"
              icon="📢"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-gray-800/50 flex justify-between px-2">
            <span className="text-xs font-medium text-gray-400">Total Outflow</span>
            <span className="text-sm font-mono font-bold text-red-400">-{formatIDR(cashFlow.outflow.totalOutflow)}</span>
          </div>
        </div>

        {/* NET CASH FLOW BANNER */}
        <div className={`p-4 rounded-xl border-2 ${
          isPositiveFlow
            ? 'bg-emerald-500/10 border-emerald-500/40'
            : 'bg-red-500/10 border-red-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{isPositiveFlow ? '📈' : '📉'}</span>
              <div>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Net Cash Flow</span>
                <p className={`text-xs ${isPositiveFlow ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                  {isPositiveFlow ? 'Perusahaan menghasilkan lebih dari yang dibakar' : 'Perusahaan membakar lebih banyak dari pendapatan'}
                </p>
              </div>
            </div>
            <span className={`text-xl font-black font-mono ${isPositiveFlow ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositiveFlow ? '+' : ''}{formatIDR(cashFlow.netCashFlow)}
            </span>
          </div>
        </div>

        {/* Burn Ratio Indicator */}
        <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
          <span className="text-xs text-gray-500">Burn Ratio:</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cashFlow.inflow.totalInflow > 0
                  ? (cashFlow.outflow.totalOutflow / cashFlow.inflow.totalInflow <= 1 ? 'bg-emerald-500' :
                     cashFlow.outflow.totalOutflow / cashFlow.inflow.totalInflow <= 1.5 ? 'bg-amber-500' : 'bg-red-500')
                  : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min(100, cashFlow.inflow.totalInflow > 0
                  ? (cashFlow.outflow.totalOutflow / cashFlow.inflow.totalInflow) * 50
                  : 100
                )}%`
              }}
            />
          </div>
          <span className="text-xs font-mono text-gray-400">
            {cashFlow.inflow.totalInflow > 0
              ? `${(cashFlow.outflow.totalOutflow / cashFlow.inflow.totalInflow).toFixed(2)}x`
              : 'N/A'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
