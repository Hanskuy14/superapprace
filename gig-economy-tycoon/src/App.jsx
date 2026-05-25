import { useState, useReducer, useCallback, useEffect, useRef } from 'react';
import { createInitialState, FUNDING_ROUNDS, SERVICES, TERRITORIES, COMPETITORS } from './engine/gameState';
import { simulateTick, resolveCrisis, executeIPO, unlockService, unlockTerritory, calculateCashRunway } from './engine/simulation';

// ============ CONSTANTS ============
const SAVE_KEY = 'gig-tycoon-save-v2';

const STRATEGIES = [
  { id: 'aggressive', name: 'Bakar Uang Agresif', emoji: '🔥', description: 'Cash lebih besar, investor expect growth gila-gilaan', cashBonus: 10_000_000_000 },
  { id: 'balanced', name: 'Balanced Growth', emoji: '⚖️', description: 'Cash standar, fokus sustainable growth', cashBonus: 0 },
  { id: 'lean', name: 'Lean Startup', emoji: '🧮', description: 'Cash minim tapi burn rate rendah', cashBonus: -5_000_000_000 },
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Mudah', emoji: '😌', description: 'Kompetitor lemah, growth cepat' },
  { id: 'normal', name: 'Normal', emoji: '😤', description: 'Simulasi realistis' },
  { id: 'hard', name: 'Sulit', emoji: '😈', description: 'Kompetitor agresif, burn tinggi' },
  { id: 'nightmare', name: 'Nightmare', emoji: '💀', description: 'Hampir mustahil survive' },
];

const TABS = [
  { id: 'operations', label: '⚙️ Operasi', icon: '⚙️' },
  { id: 'analytics', label: '📊 Analytics', icon: '📊' },
  { id: 'services', label: '🚀 Layanan', icon: '🚀' },
  { id: 'marketing', label: '🔥 Marketing', icon: '🔥' },
  { id: 'capital', label: '💰 Capital', icon: '💰' },
];


// ============ UTILITY FUNCTIONS ============
function formatIDR(value) {
  if (Math.abs(value) >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (Math.abs(value) >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}Jt`;
  return `Rp ${value.toLocaleString()}`;
}

function TrendBadge({ value, suffix = '%', invertColor = false }) {
  const isPositive = invertColor ? value < 0 : value > 0;
  const isNeutral = value === 0;
  if (isNeutral) return <span className="trend-badge-neutral">0{suffix}</span>;
  return (
    <span className={isPositive ? 'trend-badge-up' : 'trend-badge-down'}>
      {value > 0 ? '+' : ''}{value}{suffix}
    </span>
  );
}

function ProgressBar({ value, max = 100, colorClass = 'bg-cyan-500', height = 'h-2' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`w-full ${height} bg-[#1a1a3e] rounded-full overflow-hidden`}>
      <div className={`${height} ${colorClass} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusColor(value, green = 70, yellow = 40) {
  if (value >= green) return 'text-emerald-400';
  if (value >= yellow) return 'text-amber-400';
  return 'text-rose-400';
}

function StatusBg(value, green = 70, yellow = 40) {
  if (value >= green) return 'bg-emerald-500';
  if (value >= yellow) return 'bg-amber-500';
  return 'bg-rose-500';
}


// ============ LOCALSTORAGE SAVE/LOAD ============
function saveGame(state) {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, serialized);
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

function hasSavedGame() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}


// ============ GAME REDUCER ============
function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_FARE':
      return { ...state, baseFarePerKm: action.value };
    case 'TOGGLE_SURGE':
      return { ...state, surgeEnabled: !state.surgeEnabled };
    case 'SET_COMMISSION':
      return { ...state, driverCommission: action.value };
    case 'SET_ENG_BUDGET':
      return { ...state, engineeringBudget: action.value };
    case 'SET_VOUCHER_BUDGET':
      return { ...state, consumerVoucherBudget: action.value };
    case 'SET_DRIVER_POOL':
      return { ...state, driverLoyaltyPool: action.value };
    case 'TOGGLE_PR_CAMPAIGN':
      return { ...state, prCampaignActive: !state.prCampaignActive };
    case 'UNLOCK_SERVICE':
      return unlockService(state, action.serviceId);
    case 'UNLOCK_TERRITORY':
      return unlockTerritory(state, action.territoryId);
    case 'RAISE_FUNDING': {
      const round = FUNDING_ROUNDS[action.roundIndex];
      if (!round || action.roundIndex !== state.fundingRound) return state;
      if (state.mau < round.requiredMAU) return state;
      let newState = { ...state };
      const effectiveRaise = Math.floor(round.maxRaise * newState.valuationMultiplier);
      newState.cash += effectiveRaise;
      newState.totalRaised += effectiveRaise;
      newState.founderEquity -= round.dilution;
      newState.valuation = Math.floor(round.targetValuation * newState.valuationMultiplier);
      newState.fundingRound += 1;
      newState.cashFlow = {
        ...newState.cashFlow,
        inflow: { ...newState.cashFlow.inflow, vcFunding: effectiveRaise, totalInflow: newState.cashFlow.inflow.totalInflow + effectiveRaise },
        netCashFlow: newState.cashFlow.netCashFlow + effectiveRaise,
      };
      newState.notifications = [{ type: 'success', message: `💰 ${round.name} closed! Raised ${formatIDR(effectiveRaise)}` }];
      return newState;
    }
    case 'EXECUTE_IPO':
      return executeIPO(state);
    case 'RESOLVE_CRISIS':
      return resolveCrisis(state, action.choice);
    case 'ADVANCE_MONTH':
      return simulateTick(state);
    case 'RESET':
      return action.state;
    default:
      return state;
  }
}


// ============ SAVE INDICATOR COMPONENT ============
function SaveIndicator({ show }) {
  if (!show) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[95] animate-save-flash">
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        <span className="text-sm font-medium text-purple-300">Game Saved</span>
      </div>
    </div>
  );
}

// ============ NOTIFICATION TOAST ============
function NotificationToast({ notifications }) {
  const [visible, setVisible] = useState([]);
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setVisible(notifications);
      const timer = setTimeout(() => setVisible([]), 4000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);
  if (visible.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[90] space-y-2 max-w-sm">
      {visible.map((notif, i) => (
        <div key={i} className={`px-4 py-3 rounded-2xl border shadow-lg animate-slide-in text-sm backdrop-blur-sm ${
          notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
          notif.type === 'danger' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
          notif.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
          'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
        }`}>
          {notif.message}
        </div>
      ))}
    </div>
  );
}


// ============ CRISIS MODAL ============
function CrisisModal({ crisis, onResolve }) {
  if (!crisis) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="max-w-lg w-full glass-card border-rose-500/50 shadow-2xl shadow-rose-500/10 overflow-hidden">
        <div className="bg-rose-500/10 border-b border-rose-500/30 px-6 py-4">
          <h2 className="text-xl font-black text-rose-400">{crisis.title}</h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-gray-300 text-sm leading-relaxed mb-6">{crisis.description}</p>
          <div className="space-y-3">
            <button onClick={() => onResolve('A')}
              className="w-full p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all text-left group">
              <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/20">OPSI A</span>
              <p className="text-sm text-white font-medium mt-2 group-hover:text-cyan-300">{crisis.optionA.label}</p>
            </button>
            <button onClick={() => onResolve('B')}
              className="w-full p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all text-left group">
              <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/20">OPSI B</span>
              <p className="text-sm text-white font-medium mt-2 group-hover:text-amber-300">{crisis.optionB.label}</p>
            </button>
          </div>
        </div>
        <div className="px-6 py-3 bg-[#0a0a1a]/50 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">Keputusan ini tidak bisa dibatalkan.</p>
        </div>
      </div>
    </div>
  );
}


// ============ ONBOARDING SCREEN ============
function OnboardingScreen({ onStart, onResume }) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    companyName: '',
    startingCity: 'jakarta',
    difficulty: 'normal',
    strategy: 'balanced',
  });
  const savedExists = hasSavedGame();

  const handleStart = () => {
    const strategy = STRATEGIES.find(s => s.id === config.strategy);
    const finalCash = 15_000_000_000 + (strategy?.cashBonus || 0);
    onStart({ ...config, startingCash: finalCash });
  };

  const startingCities = TERRITORIES.filter(t => t.unlockCost === 0 || t.unlockCost <= 60_000_000_000);

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 mb-2">
            GIG ECONOMY TYCOON
          </h1>
          <p className="text-xl text-gray-400 font-light">The Super-App Race</p>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>

        {/* Landing buttons (step 0) */}
        {step === 0 && (
          <div className="glass-card p-8 animate-fade-in text-center space-y-4">
            <div className="text-6xl mb-4 animate-float">🏍️</div>
            <p className="text-gray-400 mb-6">Bangun kerajaan ride-hailing dari nol. Survive the burn, dominate the market.</p>
            <button onClick={() => setStep(1)}
              className="w-full py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white transition-all shadow-lg shadow-purple-500/20">
              🚀 New Game
            </button>
            <button onClick={onResume} disabled={!savedExists}
              className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
                savedExists
                  ? 'bg-[#1a1a3e] border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50'
                  : 'bg-[#111128] border border-gray-700 text-gray-600 cursor-not-allowed'
              }`}>
              {savedExists ? '💾 Resume Game' : '💾 No Save Data'}
            </button>
            {savedExists && (
              <button onClick={() => { clearSave(); window.location.reload(); }}
                className="text-xs text-rose-400/70 hover:text-rose-400 underline transition-colors">
                Reset Progress
              </button>
            )}
          </div>
        )}


        {/* Step 1: Company Name */}
        {step === 1 && (
          <div className="glass-card p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">Nama Startup Kamu</h2>
            <p className="text-gray-400 mb-6 text-sm">Pilih nama yang akan mengguncang industri.</p>
            <input type="text" value={config.companyName}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
              placeholder="contoh: RideKu, GoNow..."
              className="w-full bg-[#1a1a3e] border border-purple-500/30 rounded-xl px-4 py-3 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 mb-4"
              maxLength={20} />
            <div className="flex gap-2 flex-wrap mb-6">
              {['RideKu', 'OjelKita', 'NebengGo', 'JalanYuk', 'AntarIn'].map(name => (
                <button key={name} onClick={() => setConfig({ ...config, companyName: name })}
                  className="px-3 py-1 text-sm bg-[#1a1a3e] border border-purple-500/20 rounded-full text-gray-300 hover:border-cyan-500 hover:text-cyan-400 transition-all">
                  {name}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary flex-1">← Kembali</button>
              <button onClick={() => setStep(2)} disabled={!config.companyName.trim()} className="btn-primary flex-1">Lanjut →</button>
            </div>
          </div>
        )}

        {/* Step 2: City & Difficulty */}
        {step === 2 && (
          <div className="glass-card p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4">Kota & Kesulitan</h2>
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Kota Pertama</label>
              <div className="grid gap-2">
                {startingCities.map(city => (
                  <button key={city.id} onClick={() => setConfig({ ...config, startingCity: city.id })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.startingCity === city.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-purple-500/20 bg-[#1a1a3e] hover:border-purple-500/40'
                    }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{city.name}</span>
                      <span className="text-xs text-gray-400">{(city.population / 1_000_000).toFixed(1)}M pop</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Tingkat Kesulitan</label>
              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTIES.map(d => (
                  <button key={d.id} onClick={() => setConfig({ ...config, difficulty: d.id })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.difficulty === d.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-purple-500/20 bg-[#1a1a3e] hover:border-purple-500/40'
                    }`}>
                    <span className="text-xl">{d.emoji}</span>
                    <p className="text-sm font-bold text-white">{d.name}</p>
                    <p className="text-xs text-gray-500">{d.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Kembali</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1">Lanjut →</button>
            </div>
          </div>
        )}


        {/* Step 3: Strategy */}
        {step === 3 && (
          <div className="glass-card p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4">Strategi Awal</h2>
            <div className="grid gap-3 mb-6">
              {STRATEGIES.map(strat => (
                <button key={strat.id} onClick={() => setConfig({ ...config, strategy: strat.id })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    config.strategy === strat.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-purple-500/20 bg-[#1a1a3e] hover:border-purple-500/40'
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{strat.emoji}</span>
                    <div>
                      <span className="font-bold text-white">{strat.name}</span>
                      <p className="text-xs text-gray-400 mt-1">{strat.description}</p>
                      <p className="text-xs text-cyan-400 mt-1">Cash: Rp {((15_000_000_000 + strat.cashBonus) / 1_000_000_000).toFixed(0)} Miliar</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Kembali</button>
              <button onClick={handleStart}
                className="flex-1 py-3 rounded-xl text-lg font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white transition-all shadow-lg shadow-purple-500/20">
                🚀 Mulai {config.companyName || 'Game'}!
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>Survive the burn. Dominate the market. Build the Super-App.</p>
        </div>
      </div>
    </div>
  );
}


// ============ METRICS BAR (HERO) ============
function MetricsBar({ state }) {
  const runway = calculateCashRunway(state);
  const territory = TERRITORIES.find(t => t.id === state.currentTerritory);

  return (
    <div className="sticky top-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-md border-b border-purple-500/20">
      {/* Company Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-purple-500/10">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{state.companyName}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            {territory?.name}
          </span>
          {state.isPublic && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              {state.stockTicker} Rp {state.stockPrice.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {state.marketSentiment && state.marketSentiment.id !== 'neutral' && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
              state.valuationMultiplier > 1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>{state.marketSentiment.name} ({state.valuationMultiplier}x)</span>
          )}
          <span className="text-gray-400 font-mono text-xs">📅 M{state.month}/{state.year}</span>
          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${
            state.gamePhase === 'startup' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            state.gamePhase === 'growth' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            state.gamePhase === 'pre-ipo' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>{state.gamePhase === 'startup' ? '🌱 Startup' : state.gamePhase === 'growth' ? '🚀 Growth' : state.gamePhase === 'pre-ipo' ? '📈 Pre-IPO' : '🏛️ Public'}</span>
        </div>
      </div>


      {/* Hero Metrics */}
      <div className="grid grid-cols-4 gap-3 p-3">
        {/* Cash */}
        <div className={`metric-card items-center justify-center ${runway < 4 ? 'border-rose-500/40 shadow-lg shadow-rose-500/10' : ''}`}>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Cash Balance</span>
          <span className={`text-xl font-black mt-1 ${runway < 4 ? 'text-rose-400' : 'text-white'}`}>{formatIDR(state.cash)}</span>
          <span className={`text-[10px] ${runway < 6 ? 'text-amber-400' : 'text-gray-500'}`}>
            Runway: {runway >= 999 ? '∞' : `${runway}mo`}
          </span>
        </div>
        {/* MAU */}
        <div className="metric-card items-center justify-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">MAU</span>
          <span className="text-xl font-black text-white mt-1">
            {state.mau >= 1_000_000 ? `${(state.mau / 1_000_000).toFixed(2)}M` : `${(state.mau / 1_000).toFixed(1)}K`}
          </span>
          <TrendBadge value={state.userAnalytics?.mauChangePercent || 0} suffix="% MoM" />
        </div>
        {/* Market Share */}
        <div className="metric-card items-center justify-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Market Share</span>
          <span className="text-xl font-black text-white mt-1">{state.marketShare}%</span>
          <ProgressBar value={state.marketShare} max={80} colorClass="bg-gradient-to-r from-purple-500 to-cyan-500" />
        </div>
        {/* EBITDA */}
        <div className={`metric-card items-center justify-center ${state.ebitda < 0 ? 'border-rose-500/30' : 'border-emerald-500/30'}`}>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">EBITDA/mo</span>
          <span className={`text-xl font-black mt-1 ${state.ebitda >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {state.ebitda >= 0 ? '+' : ''}{formatIDR(state.ebitda)}
          </span>
          <span className="text-[10px] text-gray-500">{state.ebitda >= 0 ? '🟢 Profitable' : '🔴 Burning'}</span>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
        <div className="bg-[#111128]/60 border border-purple-500/10 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">App Stability</span>
          <span className={`text-xs font-bold ${StatusColor(state.appStability, 75, 50)}`}>{Math.round(state.appStability)}%</span>
        </div>
        <div className="bg-[#111128]/60 border border-purple-500/10 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">Driver Sat.</span>
          <span className={`text-xs font-bold ${StatusColor(state.driverSatisfaction, 60, 35)}`}>{Math.round(state.driverSatisfaction)}%</span>
        </div>
        <div className="bg-[#111128]/60 border border-purple-500/10 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">Consumer Ret.</span>
          <span className={`text-xs font-bold ${StatusColor(state.consumerRetention, 75, 55)}`}>{Math.round(state.consumerRetention)}%</span>
        </div>
      </div>
    </div>
  );
}


// ============ USER ANALYTICS TAB ============
function AnalyticsTab({ state }) {
  const ua = state.userAnalytics || {};
  const totalSegmented = (ua.loyalCustomers || 0) + (ua.promoHunters || 0) + (ua.churnedUsers || 0);
  const loyalPct = totalSegmented > 0 ? ((ua.loyalCustomers / totalSegmented) * 100).toFixed(1) : 0;
  const promoPct = totalSegmented > 0 ? ((ua.promoHunters / totalSegmented) * 100).toFixed(1) : 0;
  const churnPct = totalSegmented > 0 ? ((ua.churnedUsers / totalSegmented) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* MAU Breakdown Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">👥 Active User Breakdown</h3>
            <p className="text-xs text-gray-500">MAU segmented by behavior pattern</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white">{state.mau.toLocaleString()}</span>
            <TrendBadge value={ua.mauChangePercent || 0} suffix="%" />
          </div>
        </div>

        {/* Segment Bar */}
        <div className="h-6 rounded-full overflow-hidden flex mb-4">
          <div className="bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${loyalPct}%` }}>
            {loyalPct > 15 ? `${loyalPct}%` : ''}
          </div>
          <div className="bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${promoPct}%` }}>
            {promoPct > 10 ? `${promoPct}%` : ''}
          </div>
          <div className="bg-rose-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${churnPct}%` }}>
            {churnPct > 8 ? `${churnPct}%` : ''}
          </div>
        </div>

        {/* Segment Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <span className="text-2xl">💚</span>
            <p className="text-lg font-black text-emerald-400 mt-1">{(ua.loyalCustomers || 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Loyal Customers</p>
            <span className="text-xs text-emerald-400 font-bold">{loyalPct}%</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
            <span className="text-2xl">🎫</span>
            <p className="text-lg font-black text-amber-400 mt-1">{(ua.promoHunters || 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Promo Hunters</p>
            <span className="text-xs text-amber-400 font-bold">{promoPct}%</span>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
            <span className="text-2xl">💔</span>
            <p className="text-lg font-black text-rose-400 mt-1">{(ua.churnedUsers || 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Churned Users</p>
            <span className="text-xs text-rose-400 font-bold">{churnPct}%</span>
          </div>
        </div>
      </div>


      {/* Distance & Delivery Stats */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">📍 Statistik Jarak & Waktu Orderan</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1a3e] border border-cyan-500/20 rounded-xl p-4 text-center">
            <span className="text-3xl">🛣️</span>
            <p className="text-2xl font-black text-cyan-400 mt-2">{ua.avgTripDistance || 0} <span className="text-sm text-gray-400">KM</span></p>
            <p className="text-xs text-gray-500 mt-1">Avg Trip Distance</p>
            {ua.avgTripDistance > 8 && (
              <span className="trend-badge-down text-[10px] mt-2">High distance = fewer trips/hr</span>
            )}
          </div>
          <div className="bg-[#1a1a3e] border border-purple-500/20 rounded-xl p-4 text-center">
            <span className="text-3xl">⏱️</span>
            <p className="text-2xl font-black text-purple-400 mt-2">{ua.avgDeliveryTime || 0} <span className="text-sm text-gray-400">min</span></p>
            <p className="text-xs text-gray-500 mt-1">Avg Delivery Time</p>
            {ua.avgDeliveryTime > 30 && (
              <span className="trend-badge-down text-[10px] mt-2">Slow! Users may churn</span>
            )}
          </div>
        </div>
        {ua.avgTripDistance > 8 && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-400">⚠️ <strong>Distance Impact:</strong> Average trip distance is above 8 KM due to territory expansion. This increases fare revenue per trip but reduces total trips/hour unless fleet grows proportionally.</p>
          </div>
        )}
      </div>

      {/* Daily Order Volume */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">📦 Daily Order Volume</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Completed Orders</span>
              <span className="text-xl">✅</span>
            </div>
            <p className="text-3xl font-black text-emerald-400 mt-2">{(ua.dailyOrderVolume || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">/day</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Cancelled Orders</span>
              <span className="text-xl">❌</span>
            </div>
            <p className="text-3xl font-black text-rose-400 mt-2">{(ua.cancelledOrders || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">/day</p>
          </div>
        </div>

        {/* Cancellation Rate */}
        <div className="mt-4 p-4 bg-[#1a1a3e] border border-purple-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Cancellation Rate</span>
            <span className={`text-lg font-black ${(ua.cancellationRate || 0) > 10 ? 'text-rose-400' : (ua.cancellationRate || 0) > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {ua.cancellationRate || 0}%
            </span>
          </div>
          <ProgressBar value={ua.cancellationRate || 0} max={25}
            colorClass={(ua.cancellationRate || 0) > 10 ? 'bg-rose-500' : (ua.cancellationRate || 0) > 5 ? 'bg-amber-500' : 'bg-emerald-500'} />
          {(ua.cancellationRate || 0) > 10 && (
            <p className="text-xs text-rose-400 mt-2">⚠️ High cancellation rate degrades Consumer Satisfaction!</p>
          )}
        </div>
      </div>
    </div>
  );
}


// ============ OPERATIONS TAB ============
function OperationsTab({ state, dispatch }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pricing Control */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-1">💰 Kontrol Tarif</h3>
        <p className="text-xs text-gray-500 mb-4">Batas Bawah: Rp 2.000 — Batas Atas: Rp 5.000</p>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-300">Tarif Dasar /Km</label>
              <span className="text-sm font-mono text-cyan-400">Rp {state.baseFarePerKm.toLocaleString()}</span>
            </div>
            <input type="range" min="1500" max="6000" step="100" value={state.baseFarePerKm}
              onChange={(e) => dispatch({ type: 'SET_FARE', value: Number(e.target.value) })} className="slider-input" />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Rp 1.500</span><span>Rp 6.000</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#1a1a3e] rounded-xl border border-purple-500/10">
            <div>
              <span className="text-sm text-gray-300">Surge Pricing</span>
              <p className="text-xs text-gray-500">Auto naikkan tarif saat undersupply</p>
            </div>
            <button onClick={() => dispatch({ type: 'TOGGLE_SURGE' })}
              className={`relative w-12 h-6 rounded-full transition-colors ${state.surgeEnabled ? 'bg-cyan-500' : 'bg-gray-600'}`}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ left: state.surgeEnabled ? '26px' : '2px' }} />
            </button>
          </div>
          {state.surgeEnabled && (
            <div className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
              ⚡ Surge: {state.surgeMultiplier.toFixed(1)}x
            </div>
          )}
        </div>
      </div>

      {/* Driver Commission */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-1">🏍️ Komisi Driver</h3>
        <p className="text-xs text-gray-500 mb-4">Persentase potongan platform dari transaksi</p>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-300">Platform Commission</label>
              <span className={`text-sm font-mono ${state.driverCommission > 25 ? 'text-rose-400' : 'text-cyan-400'}`}>{state.driverCommission}%</span>
            </div>
            <input type="range" min="10" max="35" step="1" value={state.driverCommission}
              onChange={(e) => dispatch({ type: 'SET_COMMISSION', value: Number(e.target.value) })} className="slider-input" />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>10% (Happy)</span><span>35% (Max)</span>
            </div>
          </div>
          <div className={`p-3 rounded-xl border ${state.driverSatisfaction >= 60 ? 'bg-emerald-500/10 border-emerald-500/20' : state.driverSatisfaction >= 35 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-300">Driver Satisfaction</span>
              <span className={`text-sm font-bold ${StatusColor(state.driverSatisfaction, 60, 35)}`}>{Math.round(state.driverSatisfaction)}%</span>
            </div>
            <ProgressBar value={state.driverSatisfaction} colorClass={StatusBg(state.driverSatisfaction, 60, 35)} />
          </div>
        </div>
      </div>


      {/* Engineering Budget */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-1">⚙️ Budget Engineering</h3>
        <p className="text-xs text-gray-500 mb-4">Server & dev team investment</p>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-300">Monthly Budget</label>
              <span className="text-sm font-mono text-cyan-400">{formatIDR(state.engineeringBudget)}</span>
            </div>
            <input type="range" min="1000000000" max="30000000000" step="1000000000" value={state.engineeringBudget}
              onChange={(e) => dispatch({ type: 'SET_ENG_BUDGET', value: Number(e.target.value) })} className="slider-input" />
          </div>
          <div className={`p-3 rounded-xl border ${state.appStability >= 75 ? 'bg-emerald-500/10 border-emerald-500/20' : state.appStability >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-300">App Stability</span>
              <span className={`text-sm font-bold ${StatusColor(state.appStability, 75, 50)}`}>{Math.round(state.appStability)}%</span>
            </div>
            <ProgressBar value={state.appStability} colorClass={StatusBg(state.appStability, 75, 50)} />
          </div>
          <p className="text-xs text-gray-500">Tech Points: <span className="text-cyan-400">{state.techPoints}</span></p>
        </div>
      </div>

      {/* Unit Economics */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">📊 Unit Economics</h3>
        <div className="space-y-2">
          {[
            { label: 'Take Rate', value: `${state.takeRate}%`, color: 'text-cyan-400' },
            { label: 'Avg Wait Time', value: `${state.averageWaitTime.toFixed(1)} min`, color: state.averageWaitTime > 10 ? 'text-rose-400' : 'text-emerald-400' },
            { label: 'Revenue/mo', value: formatIDR(state.revenue), color: 'text-emerald-400' },
            { label: 'EBITDA/mo', value: `${state.ebitda >= 0 ? '+' : ''}${formatIDR(state.ebitda)}`, color: state.ebitda >= 0 ? 'text-emerald-400' : 'text-rose-400' },
            { label: 'Consumer Satisfaction', value: `${Math.round(state.consumerSatisfaction)}%`, color: StatusColor(state.consumerSatisfaction, 60, 40) },
            { label: 'Driver Supply Ratio', value: `${(state.driverSupplyRatio * 100).toFixed(0)}%`, color: state.driverSupplyRatio >= 0.8 ? 'text-emerald-400' : 'text-rose-400' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-2.5 bg-[#1a1a3e] rounded-xl border border-purple-500/10">
              <span className="text-sm text-gray-400">{item.label}</span>
              <span className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============ SERVICES TAB ============
function ServicesTab({ state, dispatch }) {
  const hasPerf = Object.keys(state.servicePerformance || {}).length > 0;
  return (
    <div className="space-y-6">
      {hasPerf && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">📊 Service P&L</h3>
            <span className="text-sm font-bold text-emerald-400 font-mono">{formatIDR(state.revenue)}/mo</span>
          </div>
          <div className="space-y-2">
            {Object.entries(state.servicePerformance).map(([sId, perf]) => (
              <div key={sId} className={`flex items-center justify-between p-3 rounded-xl border ${perf.isProfitable ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{perf.icon}</span>
                  <div>
                    <span className="text-sm font-medium text-white">{perf.name}</span>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">Rev: <span className="text-emerald-400">{formatIDR(perf.revenue)}</span></span>
                      <span className="text-xs text-gray-500">Cost: <span className="text-rose-400">{formatIDR(perf.cost)}</span></span>
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-bold font-mono ${perf.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {perf.isProfitable ? '+' : ''}{formatIDR(perf.profit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-1">🚀 Service Tree</h3>
        <p className="text-xs text-gray-500 mb-4">Unlock layanan baru untuk revenue stream</p>
        <div className="flex gap-4 mb-4 p-3 bg-[#1a1a3e] rounded-xl border border-purple-500/10">
          <span className="text-xs text-gray-400">💰 <span className="text-emerald-400 font-mono">{formatIDR(state.cash)}</span></span>
          <span className="text-xs text-gray-400">🔧 <span className="text-cyan-400 font-mono">{state.techPoints} pts</span></span>
          <span className="text-xs text-gray-400">📦 <span className="text-purple-400 font-mono">{state.unlockedServices.length}/{SERVICES.length}</span></span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((svc, idx) => {
            const unlocked = state.unlockedServices.includes(svc.id);
            const canAfford = state.cash >= svc.unlockCost && state.techPoints >= svc.techPoints;
            const prevOk = idx === 0 || state.unlockedServices.includes(SERVICES[idx - 1]?.id);
            const perf = state.servicePerformance?.[svc.id];
            return (
              <div key={svc.id} className={`relative p-4 rounded-xl border transition-all ${
                unlocked ? 'border-emerald-500/40 bg-emerald-500/5' :
                canAfford && prevOk ? 'border-cyan-500/40 bg-cyan-500/5' :
                'border-gray-700/50 bg-[#1a1a3e]/50 opacity-60'
              }`}>
                {unlocked && <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">✓ AKTIF</span>}
                <div className="text-3xl mb-2">{svc.icon}</div>
                <h4 className="font-bold text-white text-sm">{svc.name}</h4>
                <p className="text-xs text-gray-400 mt-1 mb-3">{svc.description}</p>
                {unlocked && perf && (
                  <div className={`mb-3 p-2 rounded-lg border ${perf.isProfitable ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                    <span className={`text-xs font-bold font-mono ${perf.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {perf.isProfitable ? '+' : ''}{formatIDR(perf.profit)}/mo
                    </span>
                  </div>
                )}
                {!unlocked && (
                  <div className="space-y-1 mb-3 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Cost:</span><span className={state.cash >= svc.unlockCost ? 'text-emerald-400' : 'text-rose-400'}>{formatIDR(svc.unlockCost)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Tech:</span><span className={state.techPoints >= svc.techPoints ? 'text-emerald-400' : 'text-rose-400'}>{svc.techPoints} pts</span></div>
                  </div>
                )}
                {!unlocked && prevOk && (
                  <button onClick={() => dispatch({ type: 'UNLOCK_SERVICE', serviceId: svc.id })} disabled={!canAfford}
                    className={`w-full mt-2 py-2 rounded-xl text-sm font-medium transition-all ${canAfford ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                    {canAfford ? '🔓 Unlock' : '❌ Belum Cukup'}
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


// ============ MARKETING TAB ============
function MarketingTab({ state, dispatch }) {
  const totalBurn = state.consumerVoucherBudget + state.driverLoyaltyPool + (state.prCampaignActive ? state.prCampaignCost : 0);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-1">🎫 Consumer Vouchers</h3>
        <p className="text-xs text-gray-500 mb-4">Budget cashback untuk akuisisi user</p>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-300">Monthly Budget</label>
              <span className="text-sm font-mono text-amber-400">{formatIDR(state.consumerVoucherBudget)}</span>
            </div>
            <input type="range" min="0" max="50000000000" step="1000000000" value={state.consumerVoucherBudget}
              onChange={(e) => dispatch({ type: 'SET_VOUCHER_BUDGET', value: Number(e.target.value) })} className="slider-input" />
          </div>
          <div className="p-3 bg-[#1a1a3e] rounded-xl border border-purple-500/10">
            <span className="text-xs text-gray-500 uppercase">Growth Impact</span>
            <div className="mt-2 flex items-center gap-2">
              <ProgressBar value={state.consumerVoucherBudget} max={50_000_000_000} colorClass="bg-gradient-to-r from-amber-500 to-rose-500" />
              <span className="text-xs text-amber-400 font-mono">+{Math.min(18, (state.consumerVoucherBudget / 40_000_000_000 * 18)).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-1">🏍️ Driver Loyalty Pool</h3>
        <p className="text-xs text-gray-500 mb-4">Bonus top-performing drivers</p>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-300">Monthly Pool</label>
              <span className="text-sm font-mono text-cyan-400">{formatIDR(state.driverLoyaltyPool)}</span>
            </div>
            <input type="range" min="0" max="30000000000" step="500000000" value={state.driverLoyaltyPool}
              onChange={(e) => dispatch({ type: 'SET_DRIVER_POOL', value: Number(e.target.value) })} className="slider-input" />
          </div>
          <div className="p-3 bg-[#1a1a3e] rounded-xl border border-purple-500/10">
            <span className="text-xs text-gray-500 uppercase">Retention Effect</span>
            <div className="mt-2 flex items-center gap-2">
              <ProgressBar value={state.driverLoyaltyPool} max={30_000_000_000} colorClass="bg-gradient-to-r from-cyan-500 to-emerald-500" />
              <span className="text-xs text-cyan-400 font-mono">+{Math.min(35, (state.driverLoyaltyPool / 25_000_000_000 * 35)).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">📢 PR Campaign</h3>
        <div className={`p-4 rounded-xl border ${state.prCampaignActive ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-purple-500/20 bg-[#1a1a3e]'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-white">{state.prCampaignActive ? '🟢 AKTIF' : '⚪ Nonaktif'}</span>
              <p className="text-xs text-gray-400 mt-1">Cost: {formatIDR(state.prCampaignCost)}/bln</p>
            </div>
            <button onClick={() => dispatch({ type: 'TOGGLE_PR_CAMPAIGN' })}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${state.prCampaignActive ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'}`}>
              {state.prCampaignActive ? 'Stop' : 'Launch'}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-3">🔥 Total Marketing Burn</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2.5 bg-[#1a1a3e] rounded-xl"><span className="text-sm text-gray-400">🎫 Vouchers</span><span className="text-sm font-mono text-amber-400">{formatIDR(state.consumerVoucherBudget)}</span></div>
          <div className="flex justify-between items-center p-2.5 bg-[#1a1a3e] rounded-xl"><span className="text-sm text-gray-400">🏍️ Driver Pool</span><span className="text-sm font-mono text-cyan-400">{formatIDR(state.driverLoyaltyPool)}</span></div>
          {state.prCampaignActive && <div className="flex justify-between items-center p-2.5 bg-[#1a1a3e] rounded-xl"><span className="text-sm text-gray-400">📢 PR</span><span className="text-sm font-mono text-purple-400">{formatIDR(state.prCampaignCost)}</span></div>}
          <div className="border-t border-purple-500/20 pt-2 mt-2">
            <div className="flex justify-between items-center p-3 bg-rose-500/10 rounded-xl border border-rose-500/30">
              <span className="text-sm font-medium text-rose-400">TOTAL BURN</span>
              <span className="text-sm font-mono font-bold text-rose-400">{formatIDR(totalBurn)}/bln</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============ CAPITAL TAB ============
function CapitalTab({ state, dispatch }) {
  const ipoReady = state.marketShare >= 40 && state.unlockedServices.length >= 3 && state.revenue >= 50_000_000_000;
  return (
    <div className="space-y-6">
      {/* Market Sentiment */}
      <div className={`glass-card p-6 ${state.valuationMultiplier > 1 ? 'border-emerald-500/30' : state.valuationMultiplier < 1 ? 'border-rose-500/30' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">📊 Market Sentiment</h3>
            <p className="text-xs text-gray-500">{state.marketSentiment?.description || 'Normal conditions'}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl border text-center ${state.valuationMultiplier > 1 ? 'bg-emerald-500/10 border-emerald-500/30' : state.valuationMultiplier < 1 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[#1a1a3e] border-purple-500/20'}`}>
            <span className="text-xs text-gray-400 block">Multiplier</span>
            <span className={`text-2xl font-black ${state.valuationMultiplier > 1 ? 'text-emerald-400' : state.valuationMultiplier < 1 ? 'text-rose-400' : 'text-white'}`}>{state.valuationMultiplier.toFixed(2)}x</span>
          </div>
        </div>
      </div>

      {/* Funding Rounds */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">💰 Funding Rounds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FUNDING_ROUNDS.map((round, idx) => {
            const done = idx < state.fundingRound;
            const current = idx === state.fundingRound;
            const canRaise = current && state.mau >= round.requiredMAU;
            const effRaise = Math.floor(round.maxRaise * state.valuationMultiplier);
            return (
              <div key={round.id} className={`p-4 rounded-xl border transition-all ${done ? 'border-emerald-500/30 bg-emerald-500/5' : current ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-gray-700/50 bg-[#1a1a3e]/50 opacity-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-white">{round.name}</span>
                  {done && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">✓</span>}
                  {current && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">NEXT</span>}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Raise:</span><span className="text-emerald-400">{formatIDR(effRaise)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Dilution:</span><span className="text-rose-400">-{round.dilution}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Need MAU:</span><span className={state.mau >= round.requiredMAU ? 'text-emerald-400' : 'text-rose-400'}>{round.requiredMAU > 0 ? `${(round.requiredMAU / 1000).toFixed(0)}K` : 'None'}</span></div>
                </div>
                {current && (
                  <button onClick={() => dispatch({ type: 'RAISE_FUNDING', roundIndex: idx })} disabled={!canRaise}
                    className={`w-full mt-3 py-2 rounded-xl text-sm font-medium ${canRaise ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                    {canRaise ? '🤝 Close Round' : 'Not Ready'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* Equity & IPO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-3">📊 Cap Table</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#1a1a3e] rounded-xl">
              <span className="text-sm text-gray-400">Founder Equity</span>
              <span className={`text-lg font-bold ${state.founderEquity > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>{state.founderEquity}%</span>
            </div>
            <div className="h-5 rounded-full overflow-hidden flex">
              <div className="bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${state.founderEquity}%` }}>
                {state.founderEquity > 15 ? `Founder ${state.founderEquity}%` : ''}
              </div>
              <div className="bg-gray-600 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${100 - state.founderEquity}%` }}>
                {100 - state.founderEquity > 15 ? `VC ${100 - state.founderEquity}%` : ''}
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#1a1a3e] rounded-xl">
              <span className="text-sm text-gray-400">Valuation</span>
              <span className="text-lg font-bold text-cyan-400">{formatIDR(state.valuation)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#1a1a3e] rounded-xl">
              <span className="text-sm text-gray-400">Total Raised</span>
              <span className="text-sm font-mono text-emerald-400">{formatIDR(state.totalRaised)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-3">🔔 IPO</h3>
          {state.isPublic ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
              <span className="text-3xl">🏛️</span>
              <p className="text-emerald-400 font-bold mt-2">{state.companyName} is PUBLIC!</p>
              <p className="text-2xl font-black text-white mt-1">{state.stockTicker} Rp {state.stockPrice.toLocaleString()}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Market Share ≥ 40%', met: state.marketShare >= 40, current: `${state.marketShare}%` },
                { label: '≥ 3 Services', met: state.unlockedServices.length >= 3, current: `${state.unlockedServices.length}` },
                { label: 'Revenue ≥ Rp 50M', met: state.revenue >= 50_000_000_000, current: formatIDR(state.revenue) },
              ].map((req, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${req.met ? 'bg-emerald-500/10' : 'bg-[#1a1a3e]'}`}>
                  <span>{req.met ? '✅' : '⬜'}</span>
                  <div><span className="text-sm text-gray-300">{req.label}</span><p className="text-xs text-gray-500">{req.current}</p></div>
                </div>
              ))}
              <button onClick={() => dispatch({ type: 'EXECUTE_IPO' })} disabled={!ipoReady}
                className={`w-full mt-4 py-3 rounded-xl text-base font-bold ${ipoReady ? 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white animate-pulse-glow' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                {ipoReady ? '🔔 GO PUBLIC!' : '🔒 Requirements Not Met'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Territory */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">🌏 Territory Expansion</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TERRITORIES.filter(t => t.id !== state.currentTerritory).map(t => {
            const unlocked = state.unlockedTerritories.includes(t.id);
            const canUnlock = state.cash >= t.unlockCost && state.marketShare >= 30;
            return (
              <div key={t.id} className={`p-3 rounded-xl border ${unlocked ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-purple-500/20 bg-[#1a1a3e]'}`}>
                <span className="font-medium text-sm text-white">{t.name}</span>
                <p className="text-xs text-gray-500">{t.type}</p>
                {!unlocked && (
                  <>
                    <p className="text-xs text-amber-400 mt-1">{formatIDR(t.unlockCost)}</p>
                    <button onClick={() => dispatch({ type: 'UNLOCK_TERRITORY', territoryId: t.id })} disabled={!canUnlock}
                      className={`w-full mt-2 py-1.5 rounded-lg text-xs font-medium ${canUnlock ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                      {canUnlock ? 'Expand' : 'Locked'}
                    </button>
                  </>
                )}
                {unlocked && <span className="text-xs text-emerald-400">✓ Unlocked</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ============ CASH FLOW SIDEBAR ============
function CashFlowSidebar({ state }) {
  const { cashFlow } = state;
  const positive = cashFlow.netCashFlow >= 0;
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-purple-500/20 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">📊 Cash Flow</h3>
        <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${positive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
          {positive ? '+ Inflow' : '- Burn'}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {/* Inflows */}
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Inflow</span>
          <div className="mt-1 space-y-1">
            <div className="flex justify-between text-xs"><span className="text-gray-400">🚗 Commissions</span><span className="text-emerald-400 font-mono">+{formatIDR(cashFlow.inflow.rideCommissions)}</span></div>
            {cashFlow.inflow.fintechInterest > 0 && <div className="flex justify-between text-xs"><span className="text-gray-400">💳 FinTech</span><span className="text-emerald-400 font-mono">+{formatIDR(cashFlow.inflow.fintechInterest)}</span></div>}
            {cashFlow.inflow.vcFunding > 0 && <div className="flex justify-between text-xs"><span className="text-gray-400">🏦 VC</span><span className="text-emerald-400 font-mono">+{formatIDR(cashFlow.inflow.vcFunding)}</span></div>}
          </div>
        </div>
        {/* Outflows */}
        <div>
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Outflow</span>
          <div className="mt-1 space-y-1">
            <div className="flex justify-between text-xs"><span className="text-gray-400">🎫 Subsidies</span><span className="text-rose-400 font-mono">-{formatIDR(cashFlow.outflow.consumerSubsidies)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-400">🏍️ Bonuses</span><span className="text-rose-400 font-mono">-{formatIDR(cashFlow.outflow.driverBonuses)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-400">🖥️ Servers</span><span className="text-rose-400 font-mono">-{formatIDR(cashFlow.outflow.serverCosts)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-400">👨‍💻 Staff</span><span className="text-rose-400 font-mono">-{formatIDR(cashFlow.outflow.staffSalaries)}</span></div>
          </div>
        </div>
        {/* Net */}
        <div className={`p-3 rounded-xl border ${positive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Net Flow</span>
            <span className={`text-sm font-black font-mono ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {positive ? '+' : ''}{formatIDR(cashFlow.netCashFlow)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============ GAME OVER SCREEN ============
function GameOverScreen({ state, onRestart }) {
  const totalMonths = (state.year - 2024) * 12 + state.month;
  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4">
      <div className="max-w-lg w-full glass-card border-rose-500/30 p-8 text-center animate-fade-in">
        <div className="text-6xl mb-4">💀</div>
        <h1 className="text-3xl font-black text-rose-400 mb-2">GAME OVER</h1>
        <p className="text-gray-400 mb-6">{state.gameOverReason}</p>
        <div className="bg-[#1a1a3e] rounded-xl p-5 mb-6 text-left space-y-2 border border-purple-500/20">
          <h3 className="text-sm font-bold text-gray-300 mb-3">📊 Final Stats — {state.companyName}</h3>
          {[
            ['Survived', `${totalMonths} bulan`],
            ['Peak MAU', state.mau.toLocaleString()],
            ['Market Share', `${state.marketShare}%`],
            ['Total Raised', formatIDR(state.totalRaised)],
            ['Services', `${state.unlockedServices.length}`],
            ['Valuation', formatIDR(state.valuation)],
          ].map(([l, v], i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-500">{l}:</span>
              <span className="text-white font-mono">{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onRestart} className="btn-primary w-full text-lg py-3">🔄 Mulai Lagi</button>
      </div>
    </div>
  );
}


// ============ COMMAND CENTER (MAIN GAME) ============
function CommandCenter({ state, dispatch }) {
  const [activeTab, setActiveTab] = useState('operations');
  const [showSave, setShowSave] = useState(false);
  const prevMonthRef = useRef(state.month);

  // Auto-save at end of every simulated month
  useEffect(() => {
    if (state.month !== prevMonthRef.current) {
      prevMonthRef.current = state.month;
      const success = saveGame(state);
      if (success) {
        setShowSave(true);
        const timer = setTimeout(() => setShowSave(false), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [state.month, state]);

  const advanceMonth = useCallback(() => {
    dispatch({ type: 'ADVANCE_MONTH' });
  }, [dispatch]);

  const handleCrisisResolve = useCallback((choice) => {
    dispatch({ type: 'RESOLVE_CRISIS', choice });
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] pb-16">
      <SaveIndicator show={showSave} />
      <NotificationToast notifications={state.notifications} />
      {state.activeCrisis && <CrisisModal crisis={state.activeCrisis} onResolve={handleCrisisResolve} />}

      <MetricsBar state={state} />

      {/* Tab Navigation */}
      <div className="sticky top-[220px] z-40 bg-[#0a0a1a]/95 backdrop-blur-md border-b border-purple-500/20">
        <div className="flex items-center justify-between px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`tab-btn whitespace-nowrap ${activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={advanceMonth} disabled={!!state.activeCrisis}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-lg shadow-purple-500/20 text-sm shrink-0 ml-2">
            ▶ Bulan Berikutnya
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            {activeTab === 'operations' && <OperationsTab state={state} dispatch={dispatch} />}
            {activeTab === 'analytics' && <AnalyticsTab state={state} />}
            {activeTab === 'services' && <ServicesTab state={state} dispatch={dispatch} />}
            {activeTab === 'marketing' && <MarketingTab state={state} dispatch={dispatch} />}
            {activeTab === 'capital' && <CapitalTab state={state} dispatch={dispatch} />}
          </div>
          <div className="xl:col-span-1">
            <div className="sticky top-[270px]">
              <CashFlowSidebar state={state} />
            </div>
          </div>
        </div>
      </div>

      {/* Event Log Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a1a]/95 backdrop-blur-md border-t border-purple-500/20 px-4 py-2 z-30">
        <div className="flex items-center gap-4 overflow-x-auto text-xs">
          <span className="text-purple-400 font-medium shrink-0">📝 LOG:</span>
          {state.eventLog.slice(-5).map((entry, i) => (
            <span key={i} className="text-gray-400 shrink-0">
              [{entry.year}/{entry.month}] MAU:{(entry.mau/1000).toFixed(0)}K | Share:{entry.marketShare}% |
              <span className={entry.revenue > entry.burnRate ? ' text-emerald-400' : ' text-rose-400'}>
                {' '}EBITDA:{((entry.revenue - entry.burnRate) / 1_000_000_000).toFixed(1)}M
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============ MAIN APP EXPORT ============
export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [state, dispatch] = useReducer(gameReducer, null);

  const handleStart = (config) => {
    const initialState = createInitialState(config);
    dispatch({ type: 'RESET', state: initialState });
    setGameStarted(true);
  };

  const handleResume = () => {
    const saved = loadGame();
    if (saved) {
      dispatch({ type: 'RESET', state: saved });
      setGameStarted(true);
    }
  };

  const handleRestart = () => {
    clearSave();
    setGameStarted(false);
  };

  if (!gameStarted || !state) {
    return <OnboardingScreen onStart={handleStart} onResume={handleResume} />;
  }

  if (state.isGameOver) {
    return <GameOverScreen state={state} onRestart={handleRestart} />;
  }

  return <CommandCenter state={state} dispatch={dispatch} />;
}
