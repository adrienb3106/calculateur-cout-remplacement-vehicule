import chargingOffers from "../../tarifs.json";

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

export function getBestResidenceChargingOffer(vehicle, kmCity, kmHighway) {
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
      const subscriptionYearly = getSubscriptionCostForMonths(offer, 12);
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
        totalYearly,
      };
    })
    .sort((left, right) => left.totalYearly - right.totalYearly)[0] ?? null;
}

export function getEnergyUsageBreakdown(vehicle, kmCity, kmHighway) {
  const type = vehicle?.type;

  if (type === "electric") {
    if (vehicle?.chargingSetup === "residence") {
      const bestResidenceOffer = getBestResidenceChargingOffer(vehicle, kmCity, kmHighway);
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

export function getTotalUsageCost(vehicle, kmCity, kmHighway) {
  const breakdown = getEnergyUsageBreakdown(vehicle, kmCity, kmHighway);
  const fuel = breakdown.energyYearly;
  const subscription = breakdown.subscriptionYearly;
  const annualKm = safe(kmCity) + safe(kmHighway);
  const maintenanceRatePer100Km = vehicle.type === "electric" ? 2 : 6;
  const maintenance = (annualKm / 100) * maintenanceRatePer100Km;

  const total = breakdown.totalYearly + maintenance;

  return {
    yearly: total,
    monthly: total / 12,
    fuel,
    chargingSubscription: subscription,
    maintenance,
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

export function getDepreciationCurve(vehicle, annualKm, yearsAhead = 10) {
  const price = safe(vehicle.purchasePrice);
  if (!price) return [];

  const currentYear = new Date().getFullYear();
  const registrationYear = safe(vehicle.year) || currentYear;
  const purchaseYear = safe(vehicle.purchaseYear) || registrationYear;

  // Taux annuel selon le type + kilométrage
  const baseRate = vehicle.type === "electric" ? 0.20 : 0.15;
  const kmPenalty = Math.max(0, (annualKm - 15000) / 10000) * 0.02;
  const rate = Math.min(0.40, baseRate + kmPenalty);

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
}) {
  const months = Math.max(1, Math.round(safe(horizonMonths) || 36));
  const activeLoanMonths = Math.min(months, Math.max(0, Math.round(safe(loanMonths))));
  const usageTotal = safe(usageCost?.monthly) * months;
  const loanTotal = safe(financing?.monthlyLoan) * activeLoanMonths;
  const oneShotTotal = safe(oneShotCosts);
  const total = usageTotal + loanTotal + oneShotTotal;

  return {
    horizonMonths: months,
    usageTotal,
    loanTotal,
    oneShotTotal,
    total,
    averageMonthly: total / months,
  };
}
