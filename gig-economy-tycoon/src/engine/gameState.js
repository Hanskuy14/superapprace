// ============================================================
// GIG ECONOMY TYCOON: THE SUPER-APP RACE
// Core Game State & Constants
// ============================================================

export const TERRITORIES = [
  { id: 'jakarta', name: 'Jakarta', type: 'Tier-1 Capital', population: 11_000_000, unlockCost: 0, regulationLevel: 0.6, competitorStrength: 0.7 },
  { id: 'surabaya', name: 'Surabaya', type: 'Tier-2 Metro', population: 3_000_000, unlockCost: 50_000_000_000, regulationLevel: 0.4, competitorStrength: 0.5 },
  { id: 'bandung', name: 'Bandung', type: 'Tier-2 Metro', population: 2_500_000, unlockCost: 40_000_000_000, regulationLevel: 0.3, competitorStrength: 0.4 },
  { id: 'bali', name: 'Bali', type: 'Tourism Hub', population: 4_300_000, unlockCost: 60_000_000_000, regulationLevel: 0.5, competitorStrength: 0.6 },
  { id: 'singapore', name: 'Singapore', type: 'Regional ASEAN', population: 5_900_000, unlockCost: 200_000_000_000, regulationLevel: 0.9, competitorStrength: 0.85 },
  { id: 'bangkok', name: 'Bangkok', type: 'Regional ASEAN', population: 10_500_000, unlockCost: 150_000_000_000, regulationLevel: 0.5, competitorStrength: 0.75 },
  { id: 'manila', name: 'Manila', type: 'Regional ASEAN', population: 13_900_000, unlockCost: 120_000_000_000, regulationLevel: 0.4, competitorStrength: 0.6 },
  { id: 'global', name: 'Global Markets', type: 'Global', population: 100_000_000, unlockCost: 1_000_000_000_000, regulationLevel: 0.8, competitorStrength: 0.95 },
];

export const SERVICES = [
  { id: 'ojol_bike', name: 'Ojol Motor', icon: '🏍️', unlockCost: 0, techPoints: 0, revenueMultiplier: 1.0, complexityLoad: 1.0, description: 'Layanan ojek online motor — tulang punggung bisnis' },
  { id: 'ojol_car', name: 'Ojol Mobil', icon: '🚗', unlockCost: 20_000_000_000, techPoints: 5, revenueMultiplier: 1.8, complexityLoad: 1.3, description: 'Layanan taksi online premium' },
  { id: 'food_delivery', name: 'Pesan Makan', icon: '🍜', unlockCost: 50_000_000_000, techPoints: 10, revenueMultiplier: 2.5, complexityLoad: 2.0, description: 'Delivery makanan dari restoran & warung' },
  { id: 'courier', name: 'Kurir Instan', icon: '📦', unlockCost: 80_000_000_000, techPoints: 15, revenueMultiplier: 2.0, complexityLoad: 1.8, description: 'Same-day logistics & paket kilat' },
  { id: 'fintech', name: 'Dompet Digital & PayLater', icon: '💳', unlockCost: 150_000_000_000, techPoints: 30, revenueMultiplier: 4.0, complexityLoad: 3.5, description: 'E-Wallet, QRIS, dan fitur PayLater' },
  { id: 'mart', name: 'Super Mart', icon: '🛒', unlockCost: 100_000_000_000, techPoints: 20, revenueMultiplier: 2.2, complexityLoad: 2.5, description: 'Belanja groceries instant delivery' },
];

export const FUNDING_ROUNDS = [
  { id: 'seed', name: 'Seed Round', targetValuation: 50_000_000_000, maxRaise: 10_000_000_000, dilution: 20, requiredMAU: 0 },
  { id: 'series_a', name: 'Series A', targetValuation: 200_000_000_000, maxRaise: 50_000_000_000, dilution: 18, requiredMAU: 50_000 },
  { id: 'series_b', name: 'Series B', targetValuation: 1_000_000_000_000, maxRaise: 200_000_000_000, dilution: 15, requiredMAU: 500_000 },
  { id: 'series_c', name: 'Series C', targetValuation: 5_000_000_000_000, maxRaise: 800_000_000_000, dilution: 12, requiredMAU: 2_000_000 },
  { id: 'series_d', name: 'Series D', targetValuation: 15_000_000_000_000, maxRaise: 2_000_000_000_000, dilution: 10, requiredMAU: 5_000_000 },
  { id: 'series_e', name: 'Series E (Pre-IPO)', targetValuation: 50_000_000_000_000, maxRaise: 5_000_000_000_000, dilution: 8, requiredMAU: 10_000_000 },
];

export const COMPETITORS = [
  { id: 'grabber', name: 'GrabRide', color: '#00b14f', aggression: 0.7, marketShare: 45 },
  { id: 'gojak', name: 'GoJak', color: '#00aa13', aggression: 0.6, marketShare: 35 },
  { id: 'maxim_id', name: 'Maxim Indo', color: '#ff6600', aggression: 0.4, marketShare: 10 },
  { id: 'indrive_id', name: 'InDrive Lokal', color: '#c026d3', aggression: 0.3, marketShare: 5 },
];

export const CRISES = [
  {
    id: 'driver_strike',
    title: '🚨 MOGOK MASSAL DRIVER!',
    description: 'Ribuan driver Ojol turun ke jalan memprotes kenaikan potongan komisi platform. Media nasional menyoroti demo ini. Rating app turun drastis di Play Store.',
    optionA: { label: 'Kembalikan Komisi Lama (Rugi Margin)', effect: 'revert_commission' },
    optionB: { label: 'Tahan & Ignore (Kehilangan Driver)', effect: 'lose_drivers' },
    condition: (state) => state.driverCommission > 22 && state.driverSatisfaction < 50,
  },
  {
    id: 'regulation_crackdown',
    title: '⚖️ REGULASI KEMENHUB: Tarif Batas Atas/Bawah!',
    description: 'Kementerian Perhubungan mengeluarkan regulasi baru: tarif minimum Rp 2.600/km dan maksimum Rp 3.500/km. Platform wajib comply dalam 30 hari atau izin operasional dicabut.',
    optionA: { label: 'Comply — Sesuaikan Tarif (Margin Turun)', effect: 'comply_regulation' },
    optionB: { label: 'Lobby & Lawan — Biaya Legal Rp 10M', effect: 'fight_regulation' },
    condition: (state) => state.month > 6 && Math.random() < 0.15,
  },
  {
    id: 'server_crash',
    title: '💥 SERVER DOWN! App Tidak Bisa Diakses!',
    description: 'Traffic melebihi kapasitas server 3x lipat saat promo flash sale. App crash total selama 6 jam. Jutaan order gagal. Customer ngamuk di Twitter.',
    optionA: { label: 'Emergency Scale-Up (Biaya Rp 25M)', effect: 'emergency_scale' },
    optionB: { label: 'Patch Darurat (App Stability -20%)', effect: 'patch_stability' },
    condition: (state) => state.appStability < 70 && state.mau > 1_000_000,
  },
  {
    id: 'competitor_promo_war',
    title: '🔥 PERANG PROMO! Kompetitor Bakar Uang Gila-gilaan!',
    description: 'GrabRide meluncurkan promo "Rp 1 untuk 10 trip pertama". Driver berbondong-bondong pindah ke platform mereka. Market share Anda turun 5% dalam seminggu.',
    optionA: { label: 'Counter dengan Promo Lebih Besar (Burn +50%)', effect: 'counter_promo' },
    optionB: { label: 'Fokus Retensi Driver (Bonus Pool +30%)', effect: 'retain_drivers' },
    condition: (state) => state.marketShare > 20 && Math.random() < 0.2,
  },
  {
    id: 'data_breach',
    title: '🔒 KEBOCORAN DATA! 500K Akun User Bocor!',
    description: 'Hacker berhasil membobol database. Data nama, nomor HP, dan riwayat perjalanan 500 ribu user tersebar di dark web. Kominfo mengancam suspend aplikasi.',
    optionA: { label: 'Full Disclosure + Kompensasi (Biaya Rp 50M)', effect: 'full_disclosure' },
    optionB: { label: 'Minimize & PR Spin (Risk: User Churn -15%)', effect: 'minimize_breach' },
    condition: (state) => state.appStability < 60 && state.mau > 500_000,
  },
  {
    id: 'driver_accident',
    title: '🏥 KECELAKAAN FATAL DRIVER!',
    description: 'Seorang driver mitra mengalami kecelakaan serius saat mengantar penumpang. Keluarga korban menuntut kompensasi. Kasus viral di media sosial.',
    optionA: { label: 'Tanggung Jawab Penuh + Asuransi (Rp 15M)', effect: 'cover_accident' },
    optionB: { label: 'Lepas Tangan (Status: Mitra, Bukan Karyawan)', effect: 'deny_responsibility' },
    condition: (state) => state.month > 3 && Math.random() < 0.12,
  },
  {
    id: 'investor_pressure',
    title: '📉 TEKANAN INVESTOR! Deadline Path to Profit!',
    description: 'Lead investor mengirim surat keras: "Capai EBITDA positif dalam 6 bulan atau kami tarik seat di board dan block next round." Tim leadership panik.',
    optionA: { label: 'Agresif Cost-Cutting (Lay-off 20% Tim)', effect: 'cost_cutting' },
    optionB: { label: 'Pivot Strategy — Fokus Monetisasi Fintech', effect: 'pivot_fintech' },
    condition: (state) => state.fundingRound >= 2 && state.ebitda < 0 && state.burnRate > state.revenue * 2,
  },
];

export function createInitialState(config) {
  return {
    // Meta
    companyName: config.companyName || 'RideKu',
    month: 1,
    year: 2024,
    gamePhase: 'startup', // startup | growth | pre-ipo | public
    isGameOver: false,
    gameOverReason: '',

    // Territory
    currentTerritory: config.startingCity || 'jakarta',
    unlockedTerritories: [config.startingCity || 'jakarta'],

    // Consumer Metrics
    mau: 1000,
    mauGrowthRate: 0.05,
    marketShare: 5,
    consumerSatisfaction: 70,
    averageWaitTime: 8, // minutes

    // Driver Metrics
    activeDrivers: 500,
    driverSatisfaction: 65,
    driverSupplyRatio: 0.8, // < 1 means undersupply
    driverChurnRate: 0.03,

    // Pricing & Operations
    baseFarePerKm: 2800, // IDR
    surgeMultiplier: 1.0,
    surgeEnabled: false,
    driverCommission: 20, // % platform takes
    driverBonus: 5_000_000_000, // monthly bonus pool IDR
    engineeringBudget: 3_000_000_000,

    // App Health
    appStability: 85,
    techPoints: 0,

    // Services
    unlockedServices: ['ojol_bike'],

    // Financial
    cash: config.startingCash || 15_000_000_000, // 15B IDR seed
    revenue: 0,
    burnRate: 0,
    ebitda: 0,
    takeRate: 20, // %
    totalRaised: config.startingCash || 15_000_000_000,
    valuation: 50_000_000_000,

    // Marketing
    consumerVoucherBudget: 2_000_000_000,
    driverLoyaltyPool: 1_000_000_000,
    prCampaignActive: false,
    prCampaignCost: 5_000_000_000,

    // Funding
    fundingRound: 0, // index into FUNDING_ROUNDS
    founderEquity: 100,
    isPublic: false,
    stockPrice: 0,
    stockTicker: '$GIG',
    quarterlyEarnings: [],

    // Competitor
    competitorMarketShare: 85,
    competitorAggression: 0.6,

    // Crisis
    activeCrisis: null,
    crisisHistory: [],

    // Notifications
    notifications: [],

    // Event Log
    eventLog: [],

    // Difficulty modifier
    difficulty: config.difficulty || 'normal', // easy | normal | hard | nightmare
  };
}
