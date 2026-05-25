import { useState, useReducer, useCallback } from 'react';
import { createInitialState, FUNDING_ROUNDS } from './engine/gameState';
import { simulateTick, resolveCrisis, executeIPO, unlockService, unlockTerritory } from './engine/simulation';
import OnboardingScreen from './components/OnboardingScreen';
import MetricsBar from './components/MetricsBar';
import OperationsTab from './components/OperationsTab';
import ServicesTab from './components/ServicesTab';
import MarketingTab from './components/MarketingTab';
import CapitalTab from './components/CapitalTab';
import CrisisModal from './components/CrisisModal';
import NotificationToast from './components/NotificationToast';
import GameOverScreen from './components/GameOverScreen';

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
      newState.cash += round.maxRaise;
      newState.totalRaised += round.maxRaise;
      newState.founderEquity -= round.dilution;
      newState.valuation = round.targetValuation;
      newState.fundingRound += 1;
      newState.notifications = [{ type: 'success', message: `💰 ${round.name} closed! Raised ${(round.maxRaise / 1_000_000_000).toFixed(0)}M IDR at ${(round.targetValuation / 1_000_000_000_000).toFixed(1)}T valuation.` }];
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

const TABS = [
  { id: 'operations', label: '⚙️ Operasi & Tarif', shortLabel: 'Operasi' },
  { id: 'services', label: '🚀 Ekspansi Layanan', shortLabel: 'Layanan' },
  { id: 'marketing', label: '🔥 Marketing & Growth', shortLabel: 'Marketing' },
  { id: 'capital', label: '💰 Capital & Boardroom', shortLabel: 'Capital' },
];

function CommandCenter({ state, dispatch }) {
  const [activeTab, setActiveTab] = useState('operations');

  const advanceMonth = useCallback(() => {
    dispatch({ type: 'ADVANCE_MONTH' });
  }, [dispatch]);

  const handleCrisisResolve = useCallback((choice) => {
    dispatch({ type: 'RESOLVE_CRISIS', choice });
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Notifications */}
      <NotificationToast notifications={state.notifications} />

      {/* Crisis Modal */}
      {state.activeCrisis && (
        <CrisisModal crisis={state.activeCrisis} onResolve={handleCrisisResolve} />
      )}

      {/* Top Metrics Bar */}
      <MetricsBar state={state} />

      {/* Tab Navigation */}
      <div className="sticky top-[140px] z-40 bg-gray-950 border-b border-gray-800">
        <div className="flex items-center justify-between px-4">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
              >
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Advance Month Button */}
          <button
            onClick={advanceMonth}
            disabled={!!state.activeCrisis}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold px-5 py-2 rounded-lg transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:shadow-none text-sm"
          >
            ▶ Bulan Berikutnya
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-w-7xl mx-auto">
        {activeTab === 'operations' && <OperationsTab state={state} dispatch={dispatch} />}
        {activeTab === 'services' && <ServicesTab state={state} dispatch={dispatch} />}
        {activeTab === 'marketing' && <MarketingTab state={state} dispatch={dispatch} />}
        {activeTab === 'capital' && <CapitalTab state={state} dispatch={dispatch} />}
      </div>

      {/* Event Log Ticker */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-800 px-4 py-2 z-30">
        <div className="flex items-center gap-4 overflow-x-auto text-xs">
          <span className="text-gray-500 font-medium shrink-0">📝 LOG:</span>
          {state.eventLog.slice(-5).map((entry, i) => (
            <span key={i} className="text-gray-400 shrink-0">
              [{entry.year}/{entry.month}] MAU:{(entry.mau/1000).toFixed(0)}K | Share:{entry.marketShare}% | 
              <span className={entry.revenue > entry.burnRate ? 'text-emerald-400' : 'text-red-400'}>
                {' '}EBITDA:{((entry.revenue - entry.burnRate) / 1_000_000_000).toFixed(1)}M
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [state, dispatch] = useReducer(gameReducer, null);

  const handleStart = (config) => {
    const initialState = createInitialState(config);
    dispatch({ type: 'RESET', state: initialState });
    setGameStarted(true);
  };

  const handleRestart = () => {
    setGameStarted(false);
  };

  if (!gameStarted || !state) {
    return <OnboardingScreen onStart={handleStart} />;
  }

  if (state.isGameOver) {
    return <GameOverScreen state={state} onRestart={handleRestart} />;
  }

  return <CommandCenter state={state} dispatch={dispatch} />;
}
