function safe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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
  const fuel = getFuelCostPerYear(vehicle, kmCity, kmHighway);
  const maintenance = vehicle.type === "electric" ? 400 : 900;

  const total = fuel + maintenance;

  return {
    yearly: total,
    monthly: total / 12,
    fuel,
    maintenance,
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

  const chargerCost = data.withCharger ? safe(data.chargerCost) : 0;

  return {
    finalPrice: price,
    monthlyLoan,
    chargerCost,
  };
}