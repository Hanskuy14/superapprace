// ============================================================
// GIG ECONOMY TYCOON: SIMULATION ENGINE
// The tick-based economic simulation that runs every "month"
// ============================================================

import { SERVICES, TERRITORIES, CRISES, COMPETITORS, FUNDING_ROUNDS } from './gameState';

const DIFFICULTY_MULTIPLIERS = {
  easy: { burnMult: 0.7, growthMult: 1.3, crisisChance: 0.5, competitorAggro: 0.5 },
  normal: { burnMult: 1.0, growthMult: 1.0, crisisChance: 1.0, competitorAggro: 1.0 },
  hard: { burnMult: 1.3, growthMult: 0.8, crisisChance: 1.5, competitorAggro: 1.4 },
  nightmare: { burnMult: 1.6, growthMult: 0.6, crisisChance: 2.0, competitorAggro: 1.8 },
};

export function simulateTick(state) {
  const diff = DIFFICULTY_MULTIPLIERS[state.difficulty] || DIFFICULTY_MULTIPLIERS.normal;
  let newState = { ...state };
  newState.notifications = [];

  // Advance time
  newState.month += 1;
  if (newState.month > 12) {
    newState.month = 1;
    newState.year += 1;
  }

  // ============ CONSUMER SIMULATION ============
  const territory = TERRITORIES.find(t => t.id === newState.currentTerritory) || TERRITORIES[0];
  const maxMAU = territory.population * 0.4; // max 40% penetration

  // Price sensitivity: higher fare = lower growth
  const fareSensitivity = Math.max(0, 1 - (newState.baseFarePerKm - 2000) / 5000);

  // Voucher effectiveness: diminishing returns
  const voucherEffect = Math.min(0.15, newState.consumerVoucherBudget / 50_000_000_000);

  // Wait time effect: long waits kill satisfaction
  const waitTimeEffect = Math.max(0, 1 - (newState.averageWaitTime - 5) / 20);

  // Service breadth bonus
  const serviceBreadth = newState.unlockedServices.length / SERVICES.length;

  // Calculate MAU growth
  const baseGrowth = 0.08 * diff.growthMult;
  const growthRate = (baseGrowth + voucherEffect) * fareSensitivity * waitTimeEffect * (1 + serviceBreadth * 0.5);
  const churnRate = 0.03 + (newState.averageWaitTime > 10 ? 0.02 : 0) + (newState.appStability < 70 ? 0.03 : 0);

  newState.mau = Math.min(maxMAU, Math.floor(newState.mau * (1 + growthRate - churnRate)));
  newState.mauGrowthRate = growthRate - churnRate;

  // Consumer satisfaction
  newState.consumerSatisfaction = Math.min(100, Math.max(0,
    50 + fareSensitivity * 20 + waitTimeEffect * 15 + (newState.appStability / 100) * 15 + voucherEffect * 50
  ));

  // ============ DRIVER SIMULATION ============
  // Driver attraction based on commission and bonuses
  const commissionAttractiveness = Math.max(0, 1 - (newState.driverCommission - 15) / 30); // Lower commission = happier drivers
  const bonusAttractiveness = Math.min(0.3, newState.driverLoyaltyPool / 30_000_000_000);

  // PR campaign poaching effect
  const poachEffect = newState.prCampaignActive ? 0.05 : 0;

  // Calculate driver fleet growth
  const driverGrowth = (0.04 + bonusAttractiveness + poachEffect) * commissionAttractiveness;
  const driverChurn = 0.02 + (newState.driverSatisfaction < 40 ? 0.05 : 0) + (diff.competitorAggro * 0.02);

  const desiredDrivers = newState.mau * 0.05; // Need 1 driver per 20 users
  newState.activeDrivers = Math.max(100, Math.floor(newState.activeDrivers * (1 + driverGrowth - driverChurn)));

  // Supply-demand ratio
  newState.driverSupplyRatio = Math.min(2, newState.activeDrivers / Math.max(1, desiredDrivers));

  // Average wait time (inversely proportional to supply ratio)
  newState.averageWaitTime = Math.max(3, Math.min(25, 8 / newState.driverSupplyRatio));

  // Driver satisfaction
  newState.driverSatisfaction = Math.min(100, Math.max(0,
    30 + commissionAttractiveness * 35 + bonusAttractiveness * 100 + (newState.driverSupplyRatio > 1.2 ? -10 : 5)
  ));

  // Auto surge if undersupply
  if (newState.surgeEnabled && newState.driverSupplyRatio < 0.7) {
    newState.surgeMultiplier = Math.min(3.0, 1 + (1 - newState.driverSupplyRatio) * 3);
  } else {
    newState.surgeMultiplier = 1.0;
  }

  // ============ FINANCIAL SIMULATION ============
  // Revenue calculation
  const avgTripsPerUserPerMonth = 8;
  const avgTripDistance = 7; // km
  const effectiveFare = newState.baseFarePerKm * newState.surgeMultiplier;
  const totalGMV = newState.mau * avgTripsPerUserPerMonth * avgTripDistance * effectiveFare;

  // Revenue multiplier from services
  const serviceMultiplier = newState.unlockedServices.reduce((mult, sId) => {
    const svc = SERVICES.find(s => s.id === sId);
    return mult + (svc ? (svc.revenueMultiplier - 1) * 0.3 : 0);
  }, 1);

  newState.revenue = Math.floor(totalGMV * (newState.takeRate / 100) * serviceMultiplier);

  // Burn Rate calculation
  const marketingBurn = (newState.consumerVoucherBudget + newState.driverLoyaltyPool + (newState.prCampaignActive ? newState.prCampaignCost : 0));
  const operationalBurn = newState.engineeringBudget + (newState.activeDrivers * 50_000); // Base cost per driver
  const serverCostPerUser = 500; // IDR per MAU per month
  const serverBurn = newState.mau * serverCostPerUser * (newState.unlockedServices.length);

  newState.burnRate = Math.floor((marketingBurn + operationalBurn + serverBurn) * diff.burnMult);

  // EBITDA
  newState.ebitda = newState.revenue - newState.burnRate;

  // Cash
  newState.cash = newState.cash + newState.ebitda;

  // ============ APP STABILITY ============
  const complexityLoad = newState.unlockedServices.reduce((load, sId) => {
    const svc = SERVICES.find(s => s.id === sId);
    return load + (svc ? svc.complexityLoad : 0);
  }, 0);

  const trafficLoad = newState.mau / 1_000_000; // pressure from traffic
  const engineeringMitigation = Math.min(30, newState.engineeringBudget / 1_000_000_000);

  newState.appStability = Math.min(100, Math.max(20,
    newState.appStability + engineeringMitigation * 0.5 - complexityLoad * 1.5 - trafficLoad * 2
  ));

  // Tech points accumulation
  newState.techPoints += Math.floor(newState.engineeringBudget / 5_000_000_000);

  // ============ MARKET SHARE ============
  // Market share is relative to total market users in territory
  const totalMarketUsers = territory.population * 0.3; // 30% addressable market
  const playerShare = (newState.mau / totalMarketUsers) * 100;

  // Competitor response
  const competitorGrowth = diff.competitorAggro * 0.02 * (1 - playerShare / 100);
  newState.competitorMarketShare = Math.max(20, Math.min(90, 
    100 - playerShare + competitorGrowth * 5
  ));
  newState.marketShare = Math.min(80, Math.max(1, Math.round(playerShare)));

  // ============ GAME PHASE UPDATES ============
  if (newState.isPublic) {
    newState.gamePhase = 'public';
    // Stock price simulation
    const earningsSentiment = newState.ebitda > 0 ? 1.05 : 0.92;
    const growthSentiment = newState.mauGrowthRate > 0.05 ? 1.03 : 0.97;
    newState.stockPrice = Math.max(100, Math.floor(newState.stockPrice * earningsSentiment * growthSentiment * (0.95 + Math.random() * 0.1)));
  } else if (newState.fundingRound >= 3) {
    newState.gamePhase = 'pre-ipo';
  } else if (newState.mau > 100_000) {
    newState.gamePhase = 'growth';
  }

  // ============ VALUATION UPDATE ============
  if (!newState.isPublic) {
    const revenueMultiple = newState.ebitda > 0 ? 25 : 15;
    const mauValue = newState.mau * 500_000; // 500k IDR per user valuation
    newState.valuation = Math.max(newState.valuation, Math.floor(
      Math.max(newState.revenue * revenueMultiple, mauValue)
    ));
  } else {
    newState.valuation = newState.stockPrice * 100_000_000; // simplified market cap
  }

  // ============ CRISIS CHECK ============
  if (!newState.activeCrisis) {
    const eligibleCrises = CRISES.filter(c =>
      !newState.crisisHistory.includes(c.id) && c.condition(newState)
    );
    if (eligibleCrises.length > 0 && Math.random() < 0.3 * diff.crisisChance) {
      const crisis = eligibleCrises[Math.floor(Math.random() * eligibleCrises.length)];
      newState.activeCrisis = crisis;
    }
  }

  // ============ GAME OVER CHECK ============
  if (newState.cash <= 0) {
    newState.isGameOver = true;
    newState.gameOverReason = 'BANGKRUT! Cash runway habis. Startup Anda kehabisan uang dan gagal mendapatkan funding berikutnya.';
  }

  if (newState.marketShare < 1 && newState.month > 12) {
    newState.isGameOver = true;
    newState.gameOverReason = 'TERGILAS KOMPETITOR! Market share Anda turun di bawah 1%. Investor menarik dukungan.';
  }

  // ============ EVENT LOG ============
  const logEntry = {
    month: newState.month,
    year: newState.year,
    mau: newState.mau,
    revenue: newState.revenue,
    burnRate: newState.burnRate,
    cash: newState.cash,
    marketShare: newState.marketShare,
  };
  newState.eventLog = [...newState.eventLog.slice(-23), logEntry];

  // ============ NOTIFICATIONS ============
  if (newState.cash < newState.burnRate * 3) {
    newState.notifications.push({ type: 'danger', message: '⚠️ RUNWAY KRITIS! Cash tersisa < 3 bulan!' });
  }
  if (newState.driverSatisfaction < 30) {
    newState.notifications.push({ type: 'warning', message: '😤 Driver sangat tidak puas! Risiko mogok tinggi.' });
  }
  if (newState.appStability < 50) {
    newState.notifications.push({ type: 'danger', message: '💥 App Stability kritis! Server bisa crash kapan saja.' });
  }
  if (newState.marketShare > 40 && !newState.isPublic && newState.unlockedServices.length >= 3) {
    newState.notifications.push({ type: 'success', message: '🎯 IPO Milestone mendekati! Cek Tab Capital & Boardroom.' });
  }
  if (newState.mauGrowthRate > 0.1) {
    newState.notifications.push({ type: 'success', message: '🚀 Pertumbuhan user luar biasa! Growth rate > 10%/bulan.' });
  }

  return newState;
}

export function resolveCrisis(state, choice) {
  let newState = { ...state };
  const crisis = state.activeCrisis;
  if (!crisis) return state;

  const effect = choice === 'A' ? crisis.optionA.effect : crisis.optionB.effect;

  switch (effect) {
    case 'revert_commission':
      newState.driverCommission = Math.max(15, newState.driverCommission - 5);
      newState.driverSatisfaction = Math.min(100, newState.driverSatisfaction + 20);
      newState.notifications.push({ type: 'info', message: '✅ Komisi dikembalikan. Driver kembali beroperasi.' });
      break;
    case 'lose_drivers':
      newState.activeDrivers = Math.floor(newState.activeDrivers * 0.7);
      newState.driverSatisfaction = Math.max(0, newState.driverSatisfaction - 15);
      newState.notifications.push({ type: 'danger', message: '📉 30% driver meninggalkan platform!' });
      break;
    case 'comply_regulation':
      newState.baseFarePerKm = Math.max(2600, Math.min(3500, newState.baseFarePerKm));
      newState.burnRate = Math.floor(newState.burnRate * 1.25);
      newState.notifications.push({ type: 'info', message: '⚖️ Tarif disesuaikan sesuai regulasi Kemenhub.' });
      break;
    case 'fight_regulation':
      newState.cash -= 10_000_000_000;
      newState.appStability -= 5; // risk of suspension
      newState.notifications.push({ type: 'warning', message: '⚖️ Tim legal bekerja melawan regulasi. Biaya Rp 10M.' });
      break;
    case 'emergency_scale':
      newState.cash -= 25_000_000_000;
      newState.appStability = Math.min(100, newState.appStability + 25);
      newState.notifications.push({ type: 'success', message: '☁️ Server di-scale up! Stability restored.' });
      break;
    case 'patch_stability':
      newState.appStability = Math.max(20, newState.appStability - 20);
      newState.notifications.push({ type: 'danger', message: '🩹 Patch darurat diterapkan. Stability masih rentan.' });
      break;
    case 'counter_promo':
      newState.burnRate = Math.floor(newState.burnRate * 1.5);
      newState.consumerVoucherBudget = Math.floor(newState.consumerVoucherBudget * 1.5);
      newState.marketShare = Math.min(80, newState.marketShare + 3);
      newState.notifications.push({ type: 'warning', message: '🔥 Perang promo dimulai! Burn rate melonjak.' });
      break;
    case 'retain_drivers':
      newState.driverLoyaltyPool = Math.floor(newState.driverLoyaltyPool * 1.3);
      newState.driverSatisfaction = Math.min(100, newState.driverSatisfaction + 10);
      newState.notifications.push({ type: 'info', message: '🤝 Bonus driver ditingkatkan. Loyalitas terjaga.' });
      break;
    case 'full_disclosure':
      newState.cash -= 50_000_000_000;
      newState.consumerSatisfaction = Math.max(0, newState.consumerSatisfaction - 5);
      newState.notifications.push({ type: 'info', message: '🔓 Full disclosure + kompensasi user. Trust partially restored.' });
      break;
    case 'minimize_breach':
      newState.mau = Math.floor(newState.mau * 0.85);
      newState.consumerSatisfaction = Math.max(0, newState.consumerSatisfaction - 20);
      newState.notifications.push({ type: 'danger', message: '📉 User exodus! 15% MAU hilang karena trust breach.' });
      break;
    case 'cover_accident':
      newState.cash -= 15_000_000_000;
      newState.driverSatisfaction = Math.min(100, newState.driverSatisfaction + 10);
      newState.notifications.push({ type: 'info', message: '🏥 Korban ditanggung penuh. Brand image terjaga.' });
      break;
    case 'deny_responsibility':
      newState.driverSatisfaction = Math.max(0, newState.driverSatisfaction - 20);
      newState.consumerSatisfaction = Math.max(0, newState.consumerSatisfaction - 10);
      newState.notifications.push({ type: 'danger', message: '😡 Publik murka! Driver satisfaction dan brand image turun.' });
      break;
    case 'cost_cutting':
      newState.burnRate = Math.floor(newState.burnRate * 0.7);
      newState.engineeringBudget = Math.floor(newState.engineeringBudget * 0.8);
      newState.appStability = Math.max(20, newState.appStability - 10);
      newState.notifications.push({ type: 'warning', message: '🪓 Lay-off 20%. Biaya turun tapi morale dan stability kena.' });
      break;
    case 'pivot_fintech':
      newState.techPoints += 10;
      if (!newState.unlockedServices.includes('fintech')) {
        newState.notifications.push({ type: 'info', message: '💳 Pivot ke FinTech! Tech points bertambah, tapi butuh unlock.' });
      } else {
        newState.revenue = Math.floor(newState.revenue * 1.2);
        newState.notifications.push({ type: 'success', message: '💳 Monetisasi FinTech berhasil! Revenue +20%.' });
      }
      break;
    default:
      break;
  }

  newState.activeCrisis = null;
  newState.crisisHistory = [...newState.crisisHistory, crisis.id];

  return newState;
}

export function calculateCashRunway(state) {
  if (state.ebitda >= 0) return 999; // Profitable
  return Math.max(0, Math.floor(state.cash / Math.abs(state.ebitda)));
}

export function canIPO(state) {
  return (
    state.marketShare >= 40 &&
    state.unlockedServices.length >= 3 &&
    state.revenue >= 50_000_000_000 && // 50B IDR annual equivalent (monthly * 12 simplified)
    !state.isPublic
  );
}

export function executeIPO(state) {
  if (!canIPO(state)) return state;
  let newState = { ...state };
  const ipoValuation = newState.valuation * 1.5;
  const ipoRaise = Math.floor(ipoValuation * 0.15); // 15% float
  newState.cash += ipoRaise;
  newState.totalRaised += ipoRaise;
  newState.isPublic = true;
  newState.stockPrice = Math.floor(ipoValuation / 100_000_000); // per share
  newState.founderEquity = Math.max(20, newState.founderEquity - 15);
  newState.gamePhase = 'public';
  newState.notifications.push({ type: 'success', message: `🔔 IPO BERHASIL! ${newState.companyName} melantai di bursa! Harga saham: Rp ${newState.stockPrice.toLocaleString()}` });
  newState.eventLog.push({ month: newState.month, year: newState.year, event: 'IPO', valuation: ipoValuation });
  return newState;
}

export function executeFundingRound(state, roundIndex) {
  const round = state.fundingRound;
  if (roundIndex !== round) return state;

  const fundingRound = FUNDING_ROUNDS[roundIndex];
  if (!fundingRound) return state;
  if (state.mau < fundingRound.requiredMAU) return state;

  let newState = { ...state };
  newState.cash += fundingRound.maxRaise;
  newState.totalRaised += fundingRound.maxRaise;
  newState.founderEquity -= fundingRound.dilution;
  newState.valuation = fundingRound.targetValuation;
  newState.fundingRound += 1;
  newState.notifications.push({ type: 'success', message: `💰 ${fundingRound.name} closed! Raised Rp ${(fundingRound.maxRaise / 1_000_000_000).toFixed(0)}M at Rp ${(fundingRound.targetValuation / 1_000_000_000_000).toFixed(1)}T valuation.` });
  return newState;
}

export function unlockService(state, serviceId) {
  const service = SERVICES.find(s => s.id === serviceId);
  if (!service) return state;
  if (state.unlockedServices.includes(serviceId)) return state;
  if (state.cash < service.unlockCost) return state;
  if (state.techPoints < service.techPoints) return state;

  let newState = { ...state };
  newState.cash -= service.unlockCost;
  newState.techPoints -= service.techPoints;
  newState.unlockedServices = [...newState.unlockedServices, serviceId];
  newState.notifications.push({ type: 'success', message: `🎉 Layanan baru unlocked: ${service.name}! Revenue potential meningkat.` });
  return newState;
}

export function unlockTerritory(state, territoryId) {
  const territory = TERRITORIES.find(t => t.id === territoryId);
  if (!territory) return state;
  if (state.unlockedTerritories.includes(territoryId)) return state;
  if (state.cash < territory.unlockCost) return state;

  let newState = { ...state };
  newState.cash -= territory.unlockCost;
  newState.unlockedTerritories = [...newState.unlockedTerritories, territoryId];
  newState.currentTerritory = territoryId;
  // Reset regional metrics for new territory
  newState.mau = Math.floor(newState.mau * 0.05); // Start with 5% of existing user base
  newState.marketShare = 5;
  newState.activeDrivers = Math.floor(newState.activeDrivers * 0.1);
  newState.notifications.push({ type: 'success', message: `🌏 Ekspansi ke ${territory.name}! Market share reset ke 5%. Perang baru dimulai!` });
  return newState;
}
