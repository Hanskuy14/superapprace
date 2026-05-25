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

export default function OnboardingScreen({ onStart }) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    companyName: '',
    startingCity: 'jakarta',
    difficulty: 'normal',
    strategy: 'balanced',
    startingCash: 15_000_000_000,
  });

  const handleStart = () => {
    const strategy = STRATEGIES.find(s => s.id === config.strategy);
    const finalConfig = {
      ...config,
      startingCash: 15_000_000_000 + (strategy?.cashBonus || 0),
    };
    onStart(finalConfig);
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
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
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
                  onClick={() => setConfig({ ...config, strategy: strat.id })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    config.strategy === strat.id
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
              <button onClick={handleStart} className="btn-primary flex-1 text-lg">
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
