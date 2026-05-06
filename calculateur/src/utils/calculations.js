import chargingOffers from "../../tarifs.json";

export const DEFAULT_SUBSCRIPTION_HORIZON_MONTHS = 36;
export const DEFAULT_ENERGY_INFLATION_RATE = 0.02;

function safe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isFiniteNumber(v) {
  return Number.isFinite(Number(v));
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function getNormalisedHorizonMonths(months) {
  return Math.max(1, Math.round(safe(months) || DEFAULT_SUBSCRIPTION_HORIZON_MONTHS));
}

export function getAnnualEnergyUsage(cityConsumption, highwayConsumption, kmCity, kmHighway) {
  const city = safe(cityConsumption);
  const highway = safe(highwayConsumption);

  return ((city / 100) * safe(kmCity)) + ((highway / 100) * safe(kmHighway));
}

export function getAverageElectricConsumption(cityConsumption, highwayConsumption, kmCity, kmHighway) {
  const annualKm = safe(kmCity) + safe(kmHighway);
  if (!annualKm) {
    return safe(cityConsumption) || safe(highwayConsumption);
  }

  const annualEnergy = getAnnualEnergyUsage(cityConsumption, highwayConsumption, kmCity, kmHighway);
  return annualEnergy ? (annualEnergy / annualKm) * 100 : 0;
}

export function getBlendedElectricityPrice(offPeakPrice, peakPrice, offPeakSharePercent) {
  const offPeakShare = Math.min(100, Math.max(0, safe(offPeakSharePercent))) / 100;
  const hpShare = 1 - offPeakShare;
  return (safe(offPeakPrice) * offPeakShare) + (safe(peakPrice) * hpShare);
}

export function getSubscriptionCostForMonths(offer, months) {
  const duration = Math.max(0, Math.round(safe(months)));
  if (!duration) return 0;

  const reducedDuration = Math.min(
    duration,
    Math.max(0, Math.round(safe(offer?.reduced_subscription_duration_months)))
  );
  const fullDuration = Math.max(0, duration - reducedDuration);

  return (
    (reducedDuration * safe(offer?.reduced_monthly_subscription_eur)) +
    (fullDuration * safe(offer?.full_monthly_subscription_eur))
  );
}

export function getAverageAnnualSubscriptionCost(offer, months = DEFAULT_SUBSCRIPTION_HORIZON_MONTHS) {
  const duration = getNormalisedHorizonMonths(months);
  return getSubscriptionCostForMonths(offer, duration) * (12 / duration);
}

export function getInflatedAnnualCostTotal(
  annualCost,
  months,
  annualInflationRate = DEFAULT_ENERGY_INFLATION_RATE
) {
  const duration = getNormalisedHorizonMonths(months);
  const monthlyBase = safe(annualCost) / 12;
  const rate = safe(annualInflationRate);

  return Array.from({ length: duration }, (_, index) => {
    const yearIndex = Math.floor(index / 12);
    return monthlyBase * Math.pow(1 + rate, yearIndex);
  }).reduce((sum, value) => sum + value, 0);
}

export function getChargingStationPrice(offer, timing = "after") {
  const preferred =
    timing === "before"
      ? offer?.charger_7_4kw_price_before_installation_eur
      : offer?.charger_7_4kw_price_after_installation_eur;

  if (Number.isFinite(preferred)) {
    return { price: preferred, exact: true };
  }

  const fallback =
    timing === "before"
      ? offer?.charger_7_4kw_price_after_installation_eur
      : offer?.charger_7_4kw_price_before_installation_eur;

  return {
    price: Number.isFinite(fallback) ? fallback : 0,
    exact: false,
  };
}

export function getOffPeakSharePercent(vehicle, kmCity, kmHighway) {
  if (isFiniteNumber(vehicle?.homeOffPeakShare)) {
    return clamp(Number(vehicle.homeOffPeakShare), 0, 100);
  }

  const totalKm = safe(kmCity) + safe(kmHighway);
  if (!totalKm) return 0;

  return clamp((safe(kmCity) / totalKm) * 100, 0, 100);
}

export function getBestResidenceChargingOffer(
  vehicle,
  kmCity,
  kmHighway,
  subscriptionHorizonMonths = DEFAULT_SUBSCRIPTION_HORIZON_MONTHS
) {
  const annualKwh = getAnnualEnergyUsage(
    vehicle?.cityConsumption,
    vehicle?.highwayConsumption,
    kmCity,
    kmHighway
  );

  if (!annualKwh) return null;

  const offPeakShare = getOffPeakSharePercent(vehicle, kmCity, kmHighway);

  return chargingOffers
    .map((offer) => {
      const blendedPrice = getBlendedElectricityPrice(
        offer.hc_price_eur_per_kwh,
        offer.hp_price_eur_per_kwh,
        offPeakShare
      );
      const energyYearly = annualKwh * blendedPrice;
      const subscriptionYearly = getAverageAnnualSubscriptionCost(offer, subscriptionHorizonMonths);
      const totalYearly = energyYearly + subscriptionYearly;

      return {
        offerId: offer.id,
        provider: offer.provider,
        offerName: offer.offer_name,
        label: `${offer.provider} ${offer.offer_name}`,
        blendedPrice,
        offPeakShare,
        energyYearly,
        subscriptionYearly,
        subscriptionHorizonMonths,
        totalYearly,
      };
    })
    .sort((left, right) => left.totalYearly - right.totalYearly)[0] ?? null;
}

export function getEnergyUsageBreakdown(vehicle, kmCity, kmHighway, options = {}) {
  const type = vehicle?.type;

  if (type === "electric") {
    if (vehicle?.chargingSetup === "residence") {
      const bestResidenceOffer = getBestResidenceChargingOffer(
        vehicle,
        kmCity,
        kmHighway,
        options.subscriptionHorizonMonths || options.horizonMonths || DEFAULT_SUBSCRIPTION_HORIZON_MONTHS
      );
      if (bestResidenceOffer) {
        return {
          energyYearly: bestResidenceOffer.energyYearly,
          subscriptionYearly: bestResidenceOffer.subscriptionYearly,
          totalYearly: bestResidenceOffer.totalYearly,
          effectivePrice: bestResidenceOffer.blendedPrice,
          offPeakShare: bestResidenceOffer.offPeakShare,
          residenceOfferLabel: bestResidenceOffer.label,
        };
      }
    }

    const annualKwh = getAnnualEnergyUsage(
      vehicle?.cityConsumption,
      vehicle?.highwayConsumption,
      kmCity,
      kmHighway
    );
    const hasDualRate = isFiniteNumber(vehicle?.hcPrice) || isFiniteNumber(vehicle?.hpPrice);
    const offPeakShare = getOffPeakSharePercent(vehicle, kmCity, kmHighway);
    const effectivePrice = hasDualRate
      ? getBlendedElectricityPrice(vehicle?.hcPrice, vehicle?.hpPrice, offPeakShare)
      : safe(vehicle?.energyPrice);
    const energyYearly = annualKwh * effectivePrice;

    return {
      energyYearly,
      subscriptionYearly: 0,
      totalYearly: energyYearly,
      effectivePrice,
      offPeakShare,
      residenceOfferLabel: null,
    };
  }

  const energyYearly = getFuelCostPerYear(vehicle, kmCity, kmHighway);
  return {
    energyYearly,
    subscriptionYearly: 0,
    totalYearly: energyYearly,
    effectivePrice: safe(vehicle?.energyPrice),
    offPeakShare: null,
    residenceOfferLabel: null,
  };
}

export function getFuelCostPerYear(vehicle, kmCity, kmHighway) {
  const city = safe(vehicle.cityConsumption);
  const highway = safe(vehicle.highwayConsumption);
  const price = safe(vehicle.energyPrice);

  const cityCost = (city / 100) * kmCity * price;
  const highwayCost = (highway / 100) * kmHighway * price;

  return cityCost + highwayCost;
}

export function getMaintenanceBreakdown(vehicle, kmCity, kmHighway) {
  const annualKm = safe(kmCity) + safe(kmHighway);
  const ratePer100Km = vehicle.type === "electric" ? 2 : 6;
  const baseMaintenance = (annualKm / 100) * ratePer100Km;
  const currentYear = new Date().getFullYear();
  const registrationYear = safe(vehicle?.year) || currentYear;
  const age = Math.max(0, currentYear - registrationYear);
  const currentKm = safe(vehicle?.currentKm);
  const ageThreshold = vehicle.type === "electric" ? 8 : 5;
  const kmThreshold = vehicle.type === "electric" ? 120000 : 100000;
  const ageSurcharge = Math.min(0.30, Math.max(0, age - ageThreshold) * 0.03);
  const kmSurcharge = Math.min(0.25, Math.max(0, currentKm - kmThreshold) / 50000 * 0.05);
  const factor = 1 + ageSurcharge + kmSurcharge;

  return {
    annualKm,
    ratePer100Km,
    baseMaintenance,
    age,
    currentKm,
    ageSurcharge,
    kmSurcharge,
    factor,
    maintenance: baseMaintenance * factor,
  };
}

export function getTotalUsageCost(vehicle, kmCity, kmHighway, options = {}) {
  const breakdown = getEnergyUsageBreakdown(vehicle, kmCity, kmHighway, options);
  const fuel = breakdown.energyYearly;
  const subscription = breakdown.subscriptionYearly;
  const maintenanceBreakdown = getMaintenanceBreakdown(vehicle, kmCity, kmHighway);
  const maintenance = maintenanceBreakdown.maintenance;
  const insurance = safe(vehicle?.insuranceYearly);

  const total = breakdown.totalYearly + maintenance + insurance;

  return {
    yearly: total,
    monthly: total / 12,
    fuel,
    chargingSubscription: subscription,
    maintenance,
    insurance,
    maintenanceBase: maintenanceBreakdown.baseMaintenance,
    maintenanceFactor: maintenanceBreakdown.factor,
    maintenanceAgeSurcharge: maintenanceBreakdown.ageSurcharge,
    maintenanceKmSurcharge: maintenanceBreakdown.kmSurcharge,
    effectiveEnergyPrice: breakdown.effectivePrice,
    offPeakShare: breakdown.offPeakShare,
    residenceOfferLabel: breakdown.residenceOfferLabel,
  };
}

export function getLoanMonthly(amount, rate, durationMonths) {
  const monthlyRate = rate / 100 / 12;
  const n = durationMonths;

  if (!amount || !n) return 0;
  if (rate === 0) return amount / n;

  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
}

export function getLoanRemainingBalance(amount, rate, durationMonths, paidMonths) {
  const principal = Math.max(0, safe(amount));
  const n = Math.max(0, Math.round(safe(durationMonths)));
  const paid = Math.min(n, Math.max(0, Math.round(safe(paidMonths))));
  const remainingMonths = Math.max(0, n - paid);

  if (!principal || !remainingMonths) return 0;
  if (!n) return 0;
  if (safe(rate) === 0) return principal * (remainingMonths / n);

  const monthlyRate = safe(rate) / 100 / 12;
  const growthTotal = Math.pow(1 + monthlyRate, n);
  const growthPaid = Math.pow(1 + monthlyRate, paid);

  return principal * ((growthTotal - growthPaid) / (growthTotal - 1));
}

export function getDepreciationRate(type, annualKm) {
  const baseRate = type === "electric" ? 0.20 : 0.15;
  const kmPenalty = Math.max(0, (safe(annualKm) - 15000) / 10000) * 0.02;
  return Math.min(0.40, baseRate + kmPenalty);
}

export function getEstimatedVehicleValue(vehicle, annualKm, yearsFromNow = 0) {
  const price = safe(vehicle?.purchasePrice);
  if (!price) return 0;

  const currentYear = new Date().getFullYear();
  const registrationYear = safe(vehicle?.year) || currentYear;
  const purchaseYear = safe(vehicle?.purchaseYear) || registrationYear;
  const rate = getDepreciationRate(vehicle?.type, annualKm);
  const ageAtPurchase = Math.max(0, purchaseYear - registrationYear);
  const valueAtRegistration = price / Math.pow(1 - rate, ageAtPurchase);
  const targetYear = currentYear + Math.max(0, safe(yearsFromNow));
  const targetAge = Math.max(0, targetYear - registrationYear);

  return Math.round(Math.max(0, valueAtRegistration * Math.pow(1 - rate, targetAge)));
}

export function getVehicleValueLoss(vehicle, annualKm, horizonMonths = DEFAULT_SUBSCRIPTION_HORIZON_MONTHS) {
  const currentValue = getEstimatedVehicleValue(vehicle, annualKm, 0);
  const residualValue = getEstimatedVehicleValue(vehicle, annualKm, safe(horizonMonths) / 12);

  return {
    currentValue,
    residualValue,
    valueLoss: Math.max(0, currentValue - residualValue),
  };
}

export function getDepreciationCurve(vehicle, annualKm, yearsAhead = 10) {
  const price = safe(vehicle.purchasePrice);
  if (!price) return [];

  const currentYear = new Date().getFullYear();
  const registrationYear = safe(vehicle.year) || currentYear;
  const purchaseYear = safe(vehicle.purchaseYear) || registrationYear;

  // Taux annuel selon le type + kilométrage
  const rate = getDepreciationRate(vehicle.type, annualKm);

  // La valeur au moment de l'achat = price
  // On remonte jusqu'à l'immatriculation pour afficher la courbe complète
  const ageAtPurchase = Math.max(0, purchaseYear - registrationYear);
  const valueAtRegistration = price / Math.pow(1 - rate, ageAtPurchase);

  const startYear = registrationYear;
  const endYear = currentYear + yearsAhead;

  return Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const year = startYear + i;
    const age = year - registrationYear;
    const value = Math.round(Math.max(0, valueAtRegistration * Math.pow(1 - rate, age)));
    return { year, value, isPurchase: year === purchaseYear, isToday: year === currentYear };
  });
}

export function getMaxPrice(targetMonthly, rate, durationMonths, data) {
  const r = rate / 100 / 12;
  const n = durationMonths;
  if (!targetMonthly || !n) return null;

  const loanAmount = rate === 0
    ? targetMonthly * n
    : targetMonthly * (1 - Math.pow(1 + r, -n)) / r;

  const deductions =
    (data.withTradeIn ? (parseFloat(data.tradeIn) || 0) : 0) +
    (parseFloat(data.negotiation) || 0) +
    (parseFloat(data.aids) || 0) +
    (parseFloat(data.apport) || 0);

  return Math.round(loanAmount + deductions);
}

export function getFinancing(data) {
  let price =
    safe(data.price) -
    safe(data.negotiation) -
    safe(data.aids) -
    safe(data.apport);

  if (data.withTradeIn) {
    price -= safe(data.tradeIn);
  }

  const monthlyLoan = getLoanMonthly(
    price,
    safe(data.rate),
    safe(data.duration)
  );

  return {
    finalPrice: price,
    monthlyLoan,
  };
}

export function getHorizonCashCost({
  usageCost,
  financing = {},
  horizonMonths = 36,
  loanMonths = 0,
  oneShotCosts = 0,
  downPayment = 0,
  energyInflationRate = DEFAULT_ENERGY_INFLATION_RATE,
  upfrontPurchase = 0,
}) {
  const months = getNormalisedHorizonMonths(horizonMonths);
  const activeLoanMonths = Math.min(months, Math.max(0, Math.round(safe(loanMonths))));
  const energyTotal = getInflatedAnnualCostTotal(usageCost?.fuel, months, energyInflationRate);
  const subscriptionTotal = (safe(usageCost?.chargingSubscription) / 12) * months;
  const maintenanceTotal = (safe(usageCost?.maintenance) / 12) * months;
  const insuranceTotal = (safe(usageCost?.insurance) / 12) * months;
  const usageTotal = energyTotal + subscriptionTotal + maintenanceTotal + insuranceTotal;
  const loanTotal = safe(financing?.monthlyLoan) * activeLoanMonths;
  const oneShotTotal = safe(oneShotCosts);
  const downPaymentTotal = safe(downPayment);
  const upfrontPurchaseTotal = safe(upfrontPurchase);
  const total = usageTotal + loanTotal + oneShotTotal + downPaymentTotal + upfrontPurchaseTotal;

  return {
    horizonMonths: months,
    energyTotal,
    subscriptionTotal,
    maintenanceTotal,
    insuranceTotal,
    usageTotal,
    loanTotal,
    oneShotTotal,
    downPaymentTotal,
    upfrontPurchaseTotal,
    total,
    averageMonthly: total / months,
  };
}

export function getOwnershipCost({
  vehicle,
  kmCity,
  kmHighway,
  finance = {},
  horizonMonths = DEFAULT_SUBSCRIPTION_HORIZON_MONTHS,
  oneShotCosts = 0,
  mode = "keep",
  tradeInValue = 0,
  retainedVehicle = null,
  energyInflationRate = DEFAULT_ENERGY_INFLATION_RATE,
}) {
  const months = getNormalisedHorizonMonths(horizonMonths);
  const annualKm = safe(kmCity) + safe(kmHighway);
  const usageCost = getTotalUsageCost(vehicle, kmCity, kmHighway, { horizonMonths: months });
  const financing = getFinancing(finance);
  const loanMonths = safe(finance?.duration);
  const hasLoan = loanMonths > 0 && financing.monthlyLoan > 0;
  const upfrontPurchase = mode === "acquire" && !hasLoan ? financing.finalPrice : 0;
  const downPayment = mode === "acquire" ? safe(finance?.apport) : 0;
  const paidLoanMonths = mode === "acquire" ? Math.min(months, loanMonths) : 0;
  const remainingLoanBalance = mode === "acquire"
    ? getLoanRemainingBalance(financing.finalPrice, finance?.rate, loanMonths, paidLoanMonths)
    : 0;
  const cash = getHorizonCashCost({
    usageCost,
    financing: mode === "acquire" ? financing : {},
    horizonMonths: months,
    loanMonths: mode === "acquire" ? loanMonths : 0,
    oneShotCosts,
    downPayment,
    energyInflationRate,
    upfrontPurchase,
  });
  const value = getVehicleValueLoss(vehicle, annualKm, months);
  const retainedValue = retainedVehicle ? getVehicleValueLoss(retainedVehicle, annualKm, months) : null;
  const retainedAssetCost = retainedValue ? retainedValue.valueLoss : 0;
  const tradeInOpportunityCost = mode === "acquire" ? safe(tradeInValue) : 0;
  const netCost = mode === "acquire"
    ? cash.total + remainingLoanBalance - value.residualValue + tradeInOpportunityCost + retainedAssetCost
    : cash.total + value.valueLoss;

  return {
    monthlyCash: usageCost.monthly + (mode === "acquire" ? financing.monthlyLoan : 0),
    averageMonthlyCash: cash.averageMonthly,
    firstYear: getInflatedAnnualCostTotal(usageCost.fuel, 12, energyInflationRate) +
      usageCost.chargingSubscription +
      usageCost.maintenance +
      usageCost.insurance +
      (mode === "acquire" ? financing.monthlyLoan * Math.min(12, loanMonths) : 0) +
      safe(oneShotCosts) +
      downPayment +
      upfrontPurchase,
    horizonMonths: months,
    horizonTotal: cash.total,
    residualValue: value.residualValue,
    currentValue: value.currentValue,
    valueLoss: value.valueLoss,
    remainingLoanBalance,
    retainedResidualValue: retainedValue?.residualValue || 0,
    retainedValueLoss: retainedAssetCost,
    tradeInOpportunityCost,
    netCost,
    usageCost,
    financing,
    cash,
  };
}
