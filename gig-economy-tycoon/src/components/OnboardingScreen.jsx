import { useState } from 'react';
import { TERRITORIES } from '../engine/gameState';

const STRATEGIES = [
  { id: 'aggressive', name: '🔥 Bakar Uang Agresif', description: 'Mulai dengan cash lebih besar, tapi investor expect growth gila-gilaan', cashBonus: 10_000_000_000 },
  { id: 'balanced', name: '⚖️ Balanced Growth', description: 'Cash standar, fokus sustainable growth dan unit economics', cashBonus: 0 },
  { id: 'lean', name: '🧮 Lean Startup', description: 'Cash minim tapi burn rate rendah. Setiap rupiah harus efisien', cashBonus: -5_000_000_000 },
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Mudah', emoji: '😌', description: 'Kompetitor lemah, krisis jarang, growth cepat' },
  { id: 'normal', name: 'Normal', emoji: '😤', description: 'Simulasi realistis ekonomi gig Indonesia' },
  { id: 'hard', name: 'Sulit', emoji: '😈', description: 'Kompetitor agresif, burn rate tinggi, krisis sering' },
  { id: 'nightmare', name: 'Nightmare', emoji: '💀', description: 'Hampir mustahil. Hanya 5% survive past Year 2' },
];

const BUDGET_PRESETS = [
  { label: '🏚️ Hardcore', value: 5_000_000_000, description: 'Rp 5M — Extreme challenge' },
  { label: '🧮 Lean', value: 10_000_000_000, description: 'Rp 10M — Tight budget' },
  { label: '⚖️ Standard', value: 15_000_000_000, description: 'Rp 15M — Normal start' },
  { label: '🚀 Funded', value: 25_000_000_000, description: 'Rp 25M — Well-funded' },
  { label: '💎 Mega', value: 50_000_000_000, description: 'Rp 50M — Big war chest' },
  { label: '🏖️ Sandbox', value: 10_000_000_000_000, description: 'Rp 10T — Unlimited playground' },
];

function formatBudgetIDR(value) {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  return `Rp ${(value / 1_000_000).toFixed(0)}Jt`;
}

export default function OnboardingScreen({ onStart }) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    companyName: '',
    startingCity: 'jakarta',
    difficulty: 'normal',
    strategy: 'balanced',
    startingCash: 15_000_000_000,
    useCustomBudget: false,
    customBudgetInput: '15000000000',
  });

  const handleStart = () => {
    let finalCash = config.startingCash;
    if (!config.useCustomBudget) {
      const strategy = STRATEGIES.find(s => s.id === config.strategy);
      finalCash = 15_000_000_000 + (strategy?.cashBonus || 0);
    }
    const finalConfig = {
      ...config,
      startingCash: finalCash,
    };
    onStart(finalConfig);
  };

  const handleCustomBudgetChange = (rawValue) => {
    // Allow only numbers
    const numericValue = rawValue.replace(/[^0-9]/g, '');
    const parsed = parseInt(numericValue) || 0;
    // Clamp between 5B IDR (~$300) and 100T IDR (~$6M)
    const clamped = Math.max(0, Math.min(100_000_000_000_000, parsed));
    setConfig({
      ...config,
      customBudgetInput: numericValue,
      startingCash: clamped,
    });
  };

  const startingCities = TERRITORIES.filter(t => t.unlockCost === 0 || t.unlockCost <= 60_000_000_000);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 mb-2">
            GIG ECONOMY TYCOON
          </h1>
          <p className="text-xl text-gray-400 font-light">The Super-App Race</p>
          <p className="text-xs text-gray-600 mt-1">v2.0 — Rebalanced Edition</p>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' :
                'bg-gray-800 text-gray-600'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < 4 && <div className={`w-6 h-0.5 mx-1 ${i < step ? 'bg-emerald-500' : 'bg-gray-800'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Company Name */}
        {step === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Langkah 1: Nama Startup Kamu</h2>
            <p className="text-gray-400 mb-6">Pilih nama yang akan mengguncang industri ride-hailing Indonesia.</p>
            
            <input
              type="text"
              value={config.companyName}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
              placeholder="contoh: RideKu, GoNow, NebengApp..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-4"
              maxLength={20}
            />
            
            <div className="flex gap-2 flex-wrap mb-6">
              {['RideKu', 'OjelKita', 'NebengGo', 'JalanYuk', 'AntarIn'].map(name => (
                <button
                  key={name}
                  onClick={() => setConfig({ ...config, companyName: name })}
                  className="px-3 py-1 text-sm bg-gray-800 border border-gray-700 rounded-full text-gray-300 hover:border-emerald-500 hover:text-emerald-400 transition-all"
                >
                  {name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!config.companyName.trim()}
              className="btn-primary w-full text-lg py-3"
            >
              Lanjut →
            </button>
          </div>
        )}

        {/* Step 1: Starting City */}
        {step === 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Langkah 2: Kota Pertama</h2>
            <p className="text-gray-400 mb-6">Pilih medan pertempuran pertamamu. Setiap kota punya tantangan berbeda.</p>
            
            <div className="grid gap-3">
              {startingCities.map(city => (
                <button
                  key={city.id}
                  onClick={() => setConfig({ ...config, startingCity: city.id })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    config.startingCity === city.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white">{city.name}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{city.type}</span>
                    </div>
                    <span className="text-sm text-gray-400">{(city.population / 1_000_000).toFixed(1)}M populasi</span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>Regulasi: {'🟡'.repeat(Math.ceil(city.regulationLevel * 5))}</span>
                    <span>Kompetitor: {'🔴'.repeat(Math.ceil(city.competitorStrength * 5))}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(0)} className="btn-secondary flex-1">← Kembali</button>
              <button onClick={() => setStep(2)} className="btn-primary flex-1">Lanjut →</button>
            </div>
          </div>
        )}

        {/* Step 2: Difficulty */}
        {step === 2 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Langkah 3: Tingkat Kesulitan</h2>
            <p className="text-gray-400 mb-6">Seberapa brutal kamu mau industri ini?</p>
            
            <div className="grid gap-3">
              {DIFFICULTIES.map(diff => (
                <button
                  key={diff.id}
                  onClick={() => setConfig({ ...config, difficulty: diff.id })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    config.difficulty === diff.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{diff.emoji}</span>
                    <div>
                      <span className="font-bold text-white">{diff.name}</span>
                      <p className="text-sm text-gray-400">{diff.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Kembali</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1">Lanjut →</button>
            </div>
          </div>
        )}

        {/* Step 3: Strategy */}
        {step === 3 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Langkah 4: Strategi Awal</h2>
            <p className="text-gray-400 mb-6">Bagaimana kamu akan memulai pertempuran ini?</p>
            
            <div className="grid gap-3">
              {STRATEGIES.map(strat => (
                <button
                  key={strat.id}
                  onClick={() => setConfig({ ...config, strategy: strat.id, useCustomBudget: false })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    config.strategy === strat.id && !config.useCustomBudget
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <span className="font-bold text-white">{strat.name}</span>
                  <p className="text-sm text-gray-400 mt-1">{strat.description}</p>
                  <p className="text-xs text-emerald-400 mt-1">
                    Starting Cash: Rp {((15_000_000_000 + strat.cashBonus) / 1_000_000_000).toFixed(0)} Miliar
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Kembali</button>
              <button onClick={() => setStep(4)} className="btn-primary flex-1">Lanjut →</button>
            </div>
          </div>
        )}

        {/* Step 4: Custom Budget (NEW) */}
        {step === 4 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Langkah 5: Budget Kustom</h2>
            <p className="text-gray-400 mb-6">
              Mau tentukan sendiri modal awal? Aktifkan custom budget untuk pengalaman yang kamu inginkan.
            </p>

            {/* Toggle Custom Budget */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 mb-6">
              <div>
                <span className="text-sm font-medium text-white">Custom Budget Mode</span>
                <p className="text-xs text-gray-500 mt-0.5">Override strategi dengan nominal spesifik</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, useCustomBudget: !config.useCustomBudget })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  config.useCustomBudget ? 'bg-emerald-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow-md"
                  style={{ left: config.useCustomBudget ? '30px' : '2px' }}
                />
              </button>
            </div>

            {config.useCustomBudget ? (
              <div className="space-y-5">
                {/* Direct Input */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2 font-medium">
                    Starting Capital (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">Rp</span>
                    <input
                      type="text"
                      value={config.customBudgetInput}
                      onChange={(e) => handleCustomBudgetChange(e.target.value)}
                      placeholder="15000000000"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-lg text-white font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">Min: Rp 5M (Hardcore)</span>
                    <span className="text-sm font-bold text-emerald-400">
                      = {formatBudgetIDR(config.startingCash)}
                    </span>
                  </div>
                  {config.startingCash < 5_000_000_000 && config.customBudgetInput.length > 0 && (
                    <p className="text-xs text-amber-400 mt-1">⚠️ Di bawah Rp 5M akan sangat sulit bertahan!</p>
                  )}
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Quick Presets</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BUDGET_PRESETS.map(preset => (
                      <button
                        key={preset.value}
                        onClick={() => setConfig({
                          ...config,
                          startingCash: preset.value,
                          customBudgetInput: preset.value.toString(),
                        })}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          config.startingCash === preset.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-xs font-bold text-white block">{preset.label}</span>
                        <span className="text-xs text-gray-400">{preset.description.split(' — ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Scale Visualization */}
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Budget Scale</span>
                    <span className="text-xs text-gray-400">
                      {config.startingCash <= 10_000_000_000 ? '🔥 Hardcore' :
                       config.startingCash <= 20_000_000_000 ? '⚖️ Standard' :
                       config.startingCash <= 50_000_000_000 ? '💰 Comfortable' :
                       config.startingCash <= 500_000_000_000 ? '🚀 War Chest' : '🏖️ Sandbox Mode'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-red-500 via-amber-500 via-emerald-500 to-cyan-500"
                      style={{ width: `${Math.min(100, Math.log10(Math.max(1, config.startingCash / 1_000_000_000)) / Math.log10(10000) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Rp 5M</span>
                    <span>Rp 10T (Sandbox)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 text-center">
                <span className="text-4xl">💰</span>
                <p className="text-lg font-bold text-white mt-3">
                  {formatBudgetIDR(15_000_000_000 + (STRATEGIES.find(s => s.id === config.strategy)?.cashBonus || 0))}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Berdasarkan strategi: {STRATEGIES.find(s => s.id === config.strategy)?.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Aktifkan Custom Budget di atas untuk menentukan sendiri
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1">← Kembali</button>
              <button
                onClick={handleStart}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold px-5 py-3 rounded-lg transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 text-lg"
              >
                🚀 Mulai Bangun {config.companyName || 'Startup'}!
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>Survive the burn. Dominate the market. Build the Super-App.</p>
        </div>
      </div>
    </div>
  );
}
