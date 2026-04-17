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

export function getLoanMonthly(amount, rate, duration) {
  const monthlyRate = rate / 100 / 12;
  const n = duration * 12;

  if (!amount || !duration) return 0;
  if (rate === 0) return amount / n;

  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
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