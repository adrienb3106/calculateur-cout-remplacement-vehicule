import { createContext, useContext } from "react";

const fr = {
  // App
  appTitle: "Comparateur de coût véhicule",
  situation: "Situation",
  iHave: "J'ai un véhicule :",
  iWant: "Je veux acheter :",
  thermal: "Thermique",
  electric: "Électrique",
  annualKm: "Kilométrage annuel",
  cityKm: "Ville (km)",
  highwayKm: "Autoroute (km)",
  calculate: "Calculer",
  copyright: (year) => `© ${year} développé par Adrien Bangma`,

  // VehicleForm
  currentVehicle: "Véhicule actuel",
  newVehicle: "Nouveau véhicule",
  newCar: "Neuf",
  usedCar: "Occasion",
  purchasePrice: "Prix d'achat (€)",
  purchaseYear: "Année d'achat",
  registrationYear: "Année de 1ère immatriculation",
  currentKm: "Kilométrage actuel (km)",
  cityConsumptionL: "Conso ville (L/100km)",
  highwayConsumptionL: "Conso autoroute (L/100km)",
  fuelPrice: "Prix carburant (€/L)",
  cityConsumptionKwh: "Conso ville (kWh/100km)",
  highwayConsumptionKwh: "Conso autoroute (kWh/100km)",
  electricityPrice: "Prix électricité (€/kWh)",

  // FinancingForm
  financing: "Financement",
  priceReductions: "Prix & réductions",
  vehiclePrice: "Prix véhicule (€)",
  negotiation: "Négociation (€)",
  downPayment: "Apport (€)",
  subsidies: "Aides (€)",
  tradeIn: "Reprise ?",
  tradeInValue: "Valeur reprise (€)",
  loan: "Prêt",
  loanDuration: "Durée (mois)",
  interestRate: "Taux d'intérêt (%)",
  charger: "Borne de recharge ?",
  chargerCost: "Coût installation (€)",
  budgetMax: "Calculer mon budget max",
  budgetModeMonthly: "Mensualité cible",
  budgetModeDiff: "Différence vs ancien",
  targetMonthly: "Mensualité cible (€/mois)",
  targetDiffLabel: "Différence max vs ancien (€/mois)",
  effectiveTarget: (v) => `Mensualité cible effective : ${v} €/mois`,
  maxPriceResult: (p) => `Prix catalogue max : ${p.toLocaleString("fr-FR")} €`,
  maxPriceHint: "Basé sur la durée, le taux et les réductions renseignées.",
  maxPriceHintDiff: (v) => `Mensualité cible de ${v} €/mois (votre véhicule actuel + la différence saisie).`,
  catalogPrice: "Prix catalogue",
  afterNegotiation: "Après négociation",
  afterDownPayment: "Après apport",
  afterSubsidies: "Après aides",
  afterTradeIn: "Après reprise",

  // Results
  fuelShort: "Carburant",
  maintenanceShort: "Entretien",
  loanShort: "Prêt",
  yearSmoothed: (y) => `${y} an${y > 1 ? "s" : ""}`,
  results: "Résultats",
  oldVehicle: "Ancien véhicule",
  newWithLoan: "Nouveau (avec prêt)",
  newAfterLoan: "Nouveau (après prêt)",
  fuelEnergy: "Carburant / énergie",
  maintenance: "Entretien",
  monthlyLoan: "Mensualité prêt",
  chargerFirstMonth: "Borne de recharge (1er mois)",
  monthlyTotal: "Total mensuel",
  diffVsOld: "Différence vs ancien",
  smoothedTitle: "Coût mensuel lissé dans le temps",
  smoothedDesc: (duration) => `Coût moyen mensuel en tenant compte du prêt (${duration} ans).`,
  profitable: (name) => `Rentable dès ${name}`,
  notProfitable: "Non rentable sur la période",
  endOfLoan: "Fin du prêt",
  breakeven: "Seuil",
  perMonth: "€/mois",
  unique: "(unique)",
  firstMonth: "M1",

  // DepreciationChart
  depreciationTitle: "Décote des véhicules",
  depreciationDesc: "Valeur estimée selon le type, l'âge et le kilométrage. Ligne pointillée = aujourd'hui.",
  today: "Auj.",
  purchase: "Achat",
  yearLabel: (i) => i === 0 ? "Auj." : `+${i}an`,
};

const en = {
  // App
  appTitle: "Vehicle Cost Comparator",
  situation: "Situation",
  iHave: "I currently have a:",
  iWant: "I want to buy a:",
  thermal: "Combustion",
  electric: "Electric",
  annualKm: "Annual mileage",
  cityKm: "City (km)",
  highwayKm: "Highway (km)",
  calculate: "Calculate",
  copyright: (year) => `© ${year} developed by Adrien Bangma`,

  // VehicleForm
  currentVehicle: "Current vehicle",
  newVehicle: "New vehicle",
  newCar: "New",
  usedCar: "Used",
  purchasePrice: "Purchase price (€)",
  purchaseYear: "Year of purchase",
  registrationYear: "First registration year",
  currentKm: "Current mileage (km)",
  cityConsumptionL: "City consumption (L/100km)",
  highwayConsumptionL: "Highway consumption (L/100km)",
  fuelPrice: "Fuel price (€/L)",
  cityConsumptionKwh: "City consumption (kWh/100km)",
  highwayConsumptionKwh: "Highway consumption (kWh/100km)",
  electricityPrice: "Electricity price (€/kWh)",

  // FinancingForm
  financing: "Financing",
  priceReductions: "Price & discounts",
  vehiclePrice: "Vehicle price (€)",
  negotiation: "Discount (€)",
  downPayment: "Down payment (€)",
  subsidies: "Subsidies (€)",
  tradeIn: "Trade-in?",
  tradeInValue: "Trade-in value (€)",
  loan: "Loan",
  loanDuration: "Duration (months)",
  interestRate: "Interest rate (%)",
  charger: "Include charging station?",
  chargerCost: "Installation cost (€)",
  budgetMax: "Calculate my max budget",
  budgetModeMonthly: "Target monthly",
  budgetModeDiff: "Diff vs current",
  targetMonthly: "Target monthly payment (€/mo)",
  targetDiffLabel: "Max diff vs current vehicle (€/mo)",
  effectiveTarget: (v) => `Effective target: ${v} €/mo`,
  maxPriceResult: (p) => `Max catalog price: ${p.toLocaleString("en-GB")} €`,
  maxPriceHint: "Based on the duration, rate and discounts entered.",
  maxPriceHintDiff: (v) => `Target monthly of ${v} €/mo (your current vehicle + the entered difference).`,
  catalogPrice: "List price",
  afterNegotiation: "After discount",
  afterDownPayment: "After down payment",
  afterSubsidies: "After subsidies",
  afterTradeIn: "After trade-in",

  // Results
  fuelShort: "Fuel",
  maintenanceShort: "Maintenance",
  loanShort: "Loan",
  yearSmoothed: (y) => `${y} yr${y > 1 ? "s" : ""}`,
  results: "Results",
  oldVehicle: "Current vehicle",
  newWithLoan: "New (with loan)",
  newAfterLoan: "New (after loan)",
  fuelEnergy: "Fuel / energy",
  maintenance: "Maintenance",
  monthlyLoan: "Monthly loan",
  chargerFirstMonth: "Charging station (month 1)",
  monthlyTotal: "Monthly total",
  diffVsOld: "Difference vs current",
  smoothedTitle: "Smoothed monthly cost over time",
  smoothedDesc: (duration) => `Average monthly cost factoring in the loan (${duration} yrs).`,
  profitable: (name) => `Cost-effective from ${name}`,
  notProfitable: "Not cost-effective over the period",
  endOfLoan: "End of loan",
  breakeven: "Break-even",
  perMonth: "€/mo",
  unique: "(one-time)",
  firstMonth: "M1",

  // DepreciationChart
  depreciationTitle: "Vehicle depreciation",
  depreciationDesc: "Estimated value over time based on type, age and mileage. Dashed line = today.",
  today: "Now",
  purchase: "Purchase",
  yearLabel: (i) => i === 0 ? "Now" : `+${i}yr`,
};

const translations = { fr, en };

export const LangContext = createContext(fr);

export function LangProvider({ children }) {
  const lang = navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
  return (
    <LangContext.Provider value={translations[lang]}>
      {children}
    </LangContext.Provider>
  );
}

export function useT() {
  return useContext(LangContext);
}
