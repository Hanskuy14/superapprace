// ============================================================
// GIG ECONOMY TYCOON: SIMULATION ENGINE v2.0
// Rebalanced tick-based economic simulation (15-20% easier)
// + Cash Flow Ledger, Sub-Service Breakdown, Dynamic Valuation
// ============================================================

import { SERVICES, TERRITORIES, CRISES, MARKET_SENTIMENTS, FUNDING_ROUNDS } from './gameState';

// REBALANCED: Reduced burn multipliers by ~17%, increased growth by ~18%,
// reduced competitor aggression in early game, reduced crisis frequency
const DIFFICULTY_MULTIPLIERS = {
  easy: { burnMult: 0.55, growthMult: 1.5, crisisChance: 0.35, competitorAggro: 0.35, earlyGameShield: 0.4 },
  normal: { burnMult: 0.83, growthMult: 1.18, crisisChance: 0.8, competitorAggro: 0.75, earlyGameShield: 0.6 },
  hard: { burnMult: 1.1, growthMult: 0.9, crisisChance: 1.3, competitorAggro: 1.2, earlyGameShield: 0.85 },
  nightmare: { burnMult: 1.4, growthMult: 0.65, crisisChance: 1.8, competitorAggro: 1.6, earlyGameShield: 1.0 },
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

  // Calculate game age for early-game protection
  const gameAgeMonths = (newState.year - 2024) * 12 + newState.month;
  const earlyGameFactor = gameAgeMonths <= 6 ? diff.earlyGameShield : 1.0;

  // ============ MARKET SENTIMENT (Dynamic Valuation) ============
  // Roll for new sentiment every 3 months
  if (gameAgeMonths % 3 === 0) {
    const roll = Math.random();
    let cumulative = 0;
    for (const sentiment of MARKET_SENTIMENTS) {
      cumulative += sentiment.chance;
      if (roll <= cumulative) {
        newState.marketSentiment = sentiment;
        newState.valuationMultiplier = sentiment.multiplier;
        if (sentiment.id !== 'neutral') {
          newState.notifications.push({
            type: sentiment.multiplier > 1 ? 'success' : 'warning',
            message: `📊 Market Shift: ${sentiment.name} — Valuation multiplier ${sentiment.multiplier > 1 ? '↑' : '↓'} ${sentiment.multiplier}x`
          });
        }
        break;
      }
    }
  }

  // ============ CONSUMER SIMULATION ============
  const territory = TERRITORIES.find(t => t.id === newState.currentTerritory) || TERRITORIES[0];
  const maxMAU = territory.population * 0.4; // max 40% penetration

  // Price sensitivity: higher fare = lower growth
  const fareSensitivity = Math.max(0, 1 - (newState.baseFarePerKm - 2000) / 5000);

  // REBALANCED: Increased voucher effectiveness by ~20%
  const voucherEffect = Math.min(0.18, newState.consumerVoucherBudget / 40_000_000_000);

  // Wait time effect: long waits kill satisfaction
  const waitTimeEffect = Math.max(0, 1 - (newState.averageWaitTime - 5) / 20);

  // Service breadth bonus
  const serviceBreadth = newState.unlockedServices.length / SERVICES.length;

  // REBALANCED: Higher base growth, reduced churn
  const baseGrowth = 0.095 * diff.growthMult;
  const growthRate = (baseGrowth + voucherEffect) * fareSensitivity * waitTimeEffect * (1 + serviceBreadth * 0.6);
  const churnRate = 0.025 + (newState.averageWaitTime > 10 ? 0.015 : 0) + (newState.appStability < 70 ? 0.025 : 0);

  newState.mau = Math.min(maxMAU, Math.floor(newState.mau * (1 + growthRate - churnRate)));
  newState.mauGrowthRate = growthRate - churnRate;

  // Consumer satisfaction
  newState.consumerSatisfaction = Math.min(100, Math.max(0,
    50 + fareSensitivity * 20 + waitTimeEffect * 15 + (newState.appStability / 100) * 15 + voucherEffect * 50
  ));

  // Consumer retention (new metric)
  newState.consumerRetention = Math.min(98, Math.max(40,
    70 + (newState.consumerSatisfaction - 50) * 0.4 + serviceBreadth * 10
  ));

  // ============ DRIVER SIMULATION ============
  // REBALANCED: More generous driver attraction with bonuses active
  const commissionAttractiveness = Math.max(0, 1 - (newState.driverCommission - 15) / 30);
  const bonusAttractiveness = Math.min(0.35, newState.driverLoyaltyPool / 25_000_000_000);

  // PR campaign poaching effect
  const poachEffect = newState.prCampaignActive ? 0.06 : 0;

  // REBALANCED: Higher driver growth, reduced competitor poaching in early game
  const driverGrowth = (0.05 + bonusAttractiveness + poachEffect) * commissionAttractiveness;
  const competitorPoach = diff.competitorAggro * 0.015 * earlyGameFactor;
  const driverChurn = 0.018 + (newState.driverSatisfaction < 40 ? 0.04 : 0) + competitorPoach;

  const desiredDrivers = newState.mau * 0.05;
  newState.activeDrivers = Math.max(100, Math.floor(newState.activeDrivers * (1 + driverGrowth - driverChurn)));

  // Supply-demand ratio
  newState.driverSupplyRatio = Math.min(2, newState.activeDrivers / Math.max(1, desiredDrivers));

  // Average wait time
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

  // ============ FINANCIAL SIMULATION & SUB-SERVICE BREAKDOWN ============
  const avgTripsPerUserPerMonth = 8;
  const avgTripDistance = 7; // km
  const effectiveFare = newState.baseFarePerKm * newState.surgeMultiplier;
  const totalGMV = newState.mau * avgTripsPerUserPerMonth * avgTripDistance * effectiveFare;

  // Calculate per-service revenue breakdown
  const servicePerformance = {};
  let totalServiceRevenue = 0;

  newState.unlockedServices.forEach(sId => {
    const svc = SERVICES.find(s => s.id === sId);
    if (!svc) return;

    // Each service contributes proportionally based on its revenue multiplier
    const serviceGMVShare = totalGMV * svc.monthlyBaseRevenue * svc.revenueMultiplier;
    const serviceRevenue = Math.floor(serviceGMVShare * (newState.takeRate / 100));

    // Service-specific costs (complexity drives operational cost)
    const serviceCost = Math.floor(serviceRevenue * (0.3 + (svc.complexityLoad - 1) * 0.15));

    const serviceProfit = serviceRevenue - serviceCost;
    totalServiceRevenue += serviceRevenue;

    servicePerformance[sId] = {
      name: svc.name,
      icon: svc.icon,
      revenue: serviceRevenue,
      cost: serviceCost,
      profit: serviceProfit,
      isProfitable: serviceProfit >= 0,
    };
  });

  // FinTech interest income (if fintech is unlocked)
  let fintechInterest = 0;
  if (newState.unlockedServices.includes('fintech')) {
    // FinTech generates passive income from float/lending
    fintechInterest = Math.floor(newState.mau * 200 * (newState.takeRate / 100));
    if (servicePerformance['fintech']) {
      servicePerformance['fintech'].revenue += fintechInterest;
      servicePerformance['fintech'].profit += fintechInterest;
    }
    totalServiceRevenue += fintechInterest;
  }

  newState.servicePerformance = servicePerformance;
  newState.revenue = totalServiceRevenue;

  // ============ CASH FLOW LEDGER ============
  // INFLOWS
  const inflowRideCommissions = totalServiceRevenue;
  const inflowVCFunding = 0; // Only non-zero on funding round months (handled separately)
  const inflowFintechInterest = fintechInterest;
  const totalInflow = inflowRideCommissions;

  // OUTFLOWS — REBALANCED: Reduced server costs by ~15%, reduced base cost per driver
  const outflowConsumerSubsidies = newState.consumerVoucherBudget;
  const outflowDriverBonuses = newState.driverLoyaltyPool + (newState.prCampaignActive ? newState.prCampaignCost : 0);
  const serverCostPerUser = 420; // REBALANCED: was 500, now 420 (16% reduction)
  const outflowServerCosts = Math.floor(newState.mau * serverCostPerUser * (1 + (newState.unlockedServices.length - 1) * 0.6));
  const outflowStaffSalaries = newState.engineeringBudget;
  const outflowMarketingOverhead = Math.floor((outflowConsumerSubsidies + outflowDriverBonuses) * 0.08); // 8% overhead on marketing spend
  const totalOutflow = outflowConsumerSubsidies + outflowDriverBonuses + outflowServerCosts + outflowStaffSalaries + outflowMarketingOverhead;

  newState.cashFlow = {
    inflow: {
      rideCommissions: inflowRideCommissions,
      vcFunding: inflowVCFunding,
      fintechInterest: inflowFintechInterest,
      totalInflow,
    },
    outflow: {
      consumerSubsidies: outflowConsumerSubsidies,
      driverBonuses: outflowDriverBonuses,
      serverCosts: outflowServerCosts,
      staffSalaries: outflowStaffSalaries,
      marketingOverhead: outflowMarketingOverhead,
      totalOutflow,
    },
    netCashFlow: totalInflow - totalOutflow,
  };

  // Apply difficulty multiplier to burn rate
  newState.burnRate = Math.floor(totalOutflow * diff.burnMult);

  // EBITDA
  newState.ebitda = newState.revenue - newState.burnRate;

  // Cash
  newState.cash = newState.cash + newState.ebitda;

  // ============ APP STABILITY ============
  const complexityLoad = newState.unlockedServices.reduce((load, sId) => {
    const svc = SERVICES.find(s => s.id === sId);
    return load + (svc ? svc.complexityLoad : 0);
  }, 0);

  const trafficLoad = newState.mau / 1_000_000;
  const engineeringMitigation = Math.min(30, newState.engineeringBudget / 1_000_000_000);

  // REBALANCED: Slightly more forgiving stability decay
  newState.appStability = Math.min(100, Math.max(20,
    newState.appStability + engineeringMitigation * 0.6 - complexityLoad * 1.2 - trafficLoad * 1.7
  ));

  // Tech points accumulation
  newState.techPoints += Math.floor(newState.engineeringBudget / 5_000_000_000);

  // ============ MARKET SHARE ============
  const totalMarketUsers = territory.population * 0.3;
  const playerShare = (newState.mau / totalMarketUsers) * 100;

  // REBALANCED: Reduced competitor growth impact in early game
  const competitorGrowth = diff.competitorAggro * 0.015 * earlyGameFactor * (1 - playerShare / 100);
  newState.competitorMarketShare = Math.max(20, Math.min(90,
    100 - playerShare + competitorGrowth * 5
  ));
  newState.marketShare = Math.min(80, Math.max(1, Math.round(playerShare)));

  // ============ GAME PHASE UPDATES ============
  if (newState.isPublic) {
    newState.gamePhase = 'public';
    const earningsSentiment = newState.ebitda > 0 ? 1.05 : 0.92;
    const growthSentiment = newState.mauGrowthRate > 0.05 ? 1.03 : 0.97;
    newState.stockPrice = Math.max(100, Math.floor(newState.stockPrice * earningsSentiment * growthSentiment * (0.95 + Math.random() * 0.1)));
  } else if (newState.fundingRound >= 3) {
    newState.gamePhase = 'pre-ipo';
  } else if (newState.mau > 100_000) {
    newState.gamePhase = 'growth';
  }

  // ============ DYNAMIC VALUATION UPDATE ============
  if (!newState.isPublic) {
    const revenueMultiple = newState.ebitda > 0 ? 25 : 15;
    const mauValue = newState.mau * 500_000;
    const baseValuation = Math.max(newState.revenue * revenueMultiple, mauValue);
    // Apply market sentiment multiplier
    newState.valuation = Math.max(newState.valuation, Math.floor(baseValuation * newState.valuationMultiplier));
  } else {
    newState.valuation = newState.stockPrice * 100_000_000;
  }

  // ============ CRISIS CHECK ============
  // REBALANCED: Crises are less frequent, especially in early game
  if (!newState.activeCrisis) {
    const eligibleCrises = CRISES.filter(c =>
      !newState.crisisHistory.includes(c.id) && c.condition(newState)
    );
    const crisisThreshold = 0.25 * diff.crisisChance * (gameAgeMonths <= 4 ? 0.3 : 1.0);
    if (eligibleCrises.length > 0 && Math.random() < crisisThreshold) {
      const crisis = eligibleCrises[Math.floor(Math.random() * eligibleCrises.length)];
      newState.activeCrisis = crisis;
    }
  }

  // ============ GAME OVER CHECK ============
  if (newState.cash <= 0) {
    newState.isGameOver = true;
    newState.gameOverReason = 'BANGKRUT! Cash runway habis. Startup Anda kehabisan uang dan gagal mendapatkan funding berikutnya.';
  }

  if (newState.marketShare < 1 && gameAgeMonths > 12) {
    newState.isGameOver = true;
    newState.gameOverReason = 'TERGILAS KOMPETITOR! Market share Anda turun di bawah 1%. Investor menarik dukungan.';
  }

  // ============ ADVANCED USER ANALYTICS ============
  const previousMAU = state.mau;
  const mauChangePercent = previousMAU > 0 ? ((newState.mau - previousMAU) / previousMAU) * 100 : 0;

  // MAU Segmentation
  const loyalRatio = Math.min(0.75, 0.5 + (newState.consumerSatisfaction / 100) * 0.25);
  const promoRatio = Math.min(0.4, Math.max(0.1, (newState.consumerVoucherBudget / 50_000_000_000) * 0.35));
  const churnRatio = Math.max(0.02, churnRate);
  const totalRatio = loyalRatio + promoRatio + churnRatio;
  const loyalCustomers = Math.floor(newState.mau * (loyalRatio / totalRatio));
  const promoHunters = Math.floor(newState.mau * (promoRatio / totalRatio));
  const churnedUsers = newState.mau - loyalCustomers - promoHunters;

  // Distance & Delivery stats
  const territorySprawl = newState.unlockedTerritories.length;
  const baseDistance = 5.5 + territorySprawl * 0.8 + (newState.mau / 1_000_000) * 1.2;
  const analyticsAvgDistance = Math.min(15, Math.max(4, baseDistance + (Math.random() - 0.5) * 0.6));
  const driverAvailabilityFactor = Math.max(0.6, Math.min(1.4, newState.driverSupplyRatio));
  const avgDeliveryTime = Math.min(45, Math.max(12, (analyticsAvgDistance * 3.2) / driverAvailabilityFactor + (Math.random() - 0.5) * 2));

  // Order volume
  const avgTripsPerDay = Math.floor(newState.mau * avgTripsPerUserPerMonth / 30);
  const baseCancellationRate = 3 + (100 - newState.consumerSatisfaction) * 0.08 + (newState.averageWaitTime > 10 ? 3 : 0);
  const cancellationRate = Math.min(25, Math.max(2, baseCancellationRate + (Math.random() - 0.5) * 1.5));
  const cancelledOrders = Math.floor(avgTripsPerDay * (cancellationRate / 100));
  const dailyOrderVolume = avgTripsPerDay - cancelledOrders;

  // Distance impact on economics: higher distance = higher fare but fewer trips/hour
  if (analyticsAvgDistance > 8 && newState.activeDrivers < desiredDrivers * 1.2) {
    // Fewer trips completed when distance is high and fleet is small
    newState.mau = Math.floor(newState.mau * (1 - (analyticsAvgDistance - 8) * 0.005));
  }

  // Cancellation impact on satisfaction
  if (cancellationRate > 10) {
    newState.consumerSatisfaction = Math.max(0, newState.consumerSatisfaction - (cancellationRate - 10) * 0.5);
  }

  newState.userAnalytics = {
    loyalCustomers,
    promoHunters,
    churnedUsers: Math.max(0, churnedUsers),
    avgTripDistance: Math.round(analyticsAvgDistance * 10) / 10,
    avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
    dailyOrderVolume,
    cancelledOrders,
    cancellationRate: Math.round(cancellationRate * 10) / 10,
    previousMAU,
    mauChangePercent: Math.round(mauChangePercent * 10) / 10,
  };

  // ============ EVENT LOG ============
  const logEntry = {
    month: newState.month,
    year: newState.year,
    mau: newState.mau,
    revenue: newState.revenue,
    burnRate: newState.burnRate,
    cash: newState.cash,
    marketShare: newState.marketShare,
    netCashFlow: newState.cashFlow.netCashFlow,
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
      newState.appStability -= 5;
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
    state.revenue >= 50_000_000_000 &&
    !state.isPublic
  );
}

export function executeIPO(state) {
  if (!canIPO(state)) return state;
  let newState = { ...state };
  const ipoValuation = newState.valuation * 1.5 * newState.valuationMultiplier;
  const ipoRaise = Math.floor(ipoValuation * 0.15);
  newState.cash += ipoRaise;
  newState.totalRaised += ipoRaise;
  newState.isPublic = true;
  newState.stockPrice = Math.floor(ipoValuation / 100_000_000);
  newState.founderEquity = Math.max(20, newState.founderEquity - 15);
  newState.gamePhase = 'public';
  newState.notifications.push({ type: 'success', message: `🔔 IPO BERHASIL! ${newState.companyName} melantai di bursa! Harga saham: Rp ${newState.stockPrice.toLocaleString()}` });
  newState.eventLog.push({ month: newState.month, year: newState.year, event: 'IPO', valuation: ipoValuation });

  // Update cash flow to reflect IPO raise
  newState.cashFlow = {
    ...newState.cashFlow,
    inflow: { ...newState.cashFlow.inflow, vcFunding: ipoRaise, totalInflow: newState.cashFlow.inflow.totalInflow + ipoRaise },
    netCashFlow: newState.cashFlow.netCashFlow + ipoRaise,
  };

  return newState;
}

export function executeFundingRound(state, roundIndex) {
  const round = state.fundingRound;
  if (roundIndex !== round) return state;

  const fundingRound = FUNDING_ROUNDS[roundIndex];
  if (!fundingRound) return state;
  if (state.mau < fundingRound.requiredMAU) return state;

  let newState = { ...state };
  // Apply valuation multiplier to raise amount during favorable market
  const effectiveRaise = Math.floor(fundingRound.maxRaise * newState.valuationMultiplier);
  newState.cash += effectiveRaise;
  newState.totalRaised += effectiveRaise;
  newState.founderEquity -= fundingRound.dilution;
  newState.valuation = Math.floor(fundingRound.targetValuation * newState.valuationMultiplier);
  newState.fundingRound += 1;

  // Update cash flow ledger
  newState.cashFlow = {
    ...newState.cashFlow,
    inflow: { ...newState.cashFlow.inflow, vcFunding: effectiveRaise, totalInflow: newState.cashFlow.inflow.totalInflow + effectiveRaise },
    netCashFlow: newState.cashFlow.netCashFlow + effectiveRaise,
  };

  newState.notifications.push({ type: 'success', message: `💰 ${fundingRound.name} closed! Raised Rp ${(effectiveRaise / 1_000_000_000).toFixed(0)}M at Rp ${(newState.valuation / 1_000_000_000_000).toFixed(1)}T valuation.` });
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
  newState.mau = Math.floor(newState.mau * 0.05);
  newState.marketShare = 5;
  newState.activeDrivers = Math.floor(newState.activeDrivers * 0.1);
  newState.notifications.push({ type: 'success', message: `🌏 Ekspansi ke ${territory.name}! Market share reset ke 5%. Perang baru dimulai!` });
  return newState;
}
