// Tarifs opérateurs de recharge rapide (France)
// Dernière mise à jour : avril 2026
// Mettre à jour les prix kWh et abonnements selon les fluctuations tarifaires

export const operators = [
  {
    id: "fastned",
    name: "Fastned",
    type: "DC",
    powerKw: "50–300 kW",
    subscriptionMonthly: 11.99,   // € / mois (Fastned Premium)
    pricePerKwhNoSub: 0.79,       // € / kWh sans abonnement
    pricePerKwhWithSub: 0.49,     // € / kWh avec abonnement
    notes: "Autoroutes & grands axes. Premium = -38%",
  },
  {
    id: "powerdot",
    name: "PowerDot",
    type: "AC/DC",
    powerKw: "22–150 kW",
    subscriptionMonthly: 0,       // Pass gratuit
    pricePerKwhNoSub: 0.55,       // € / kWh DC sans abonnement
    pricePerKwhWithSub: 0.55,     // identique (pas d'abonnement payant)
    notes: "Pass gratuit, prix variables selon borne",
  },
  {
    id: "mobilize",
    name: "Mobilize (Renault)",
    type: "AC/DC",
    powerKw: "7–130 kW",
    subscriptionMonthly: 9.99,    // € / mois Mobilize Charge Pass+
    pricePerKwhNoSub: 0.49,       // € / kWh sans abonnement
    pricePerKwhWithSub: 0.39,     // € / kWh avec abonnement
    notes: "Réseau Zeplug + partenaires. Tarif préférentiel Renault/Dacia.",
  },
  {
    id: "tesla",
    name: "Tesla Supercharger",
    type: "DC",
    powerKw: "72–250 kW",
    subscriptionMonthly: 12.99,   // € / mois (Premium Connectivity inclus)
    pricePerKwhNoSub: 0.55,       // € / kWh pour véhicules non-Tesla
    pricePerKwhWithSub: 0.44,     // € / kWh pour Tesla avec compte actif
    notes: "Ouvert à tous les véhicules CCS depuis 2023",
  },
  {
    id: "izi",
    name: "Izi (TotalEnergies / McDonald's)",
    type: "DC",
    powerKw: "50–150 kW",
    subscriptionMonthly: 0,       // Pas d'abonnement
    pricePerKwhNoSub: 0.47,       // € / kWh
    pricePerKwhWithSub: 0.47,
    notes: "Parkings McDonald's & centres commerciaux. Pas d'abonnement.",
  },
  {
    id: "ionity",
    name: "Ionity",
    type: "DC",
    powerKw: "50–350 kW",
    subscriptionMonthly: 17.99,   // € / mois (Ionity Passport)
    pricePerKwhNoSub: 0.79,       // € / kWh sans abonnement
    pricePerKwhWithSub: 0.35,     // € / kWh avec Passport
    notes: "Autoroutes Europe. Certains constructeurs ont tarifs préférentiels.",
  },
  {
    id: "electra",
    name: "Electra",
    type: "DC",
    powerKw: "150–300 kW",
    subscriptionMonthly: 5.00,    // € / mois (Electra Pass)
    pricePerKwhNoSub: 0.59,       // € / kWh sans abonnement
    pricePerKwhWithSub: 0.45,     // € / kWh avec Pass
    notes: "Centres-villes & retail. Ultra-rapide.",
  },
  {
    id: "atlante",
    name: "Atlante",
    type: "DC",
    powerKw: "50–300 kW",
    subscriptionMonthly: 0,       // Pas d'abonnement dédié
    pricePerKwhNoSub: 0.49,       // € / kWh
    pricePerKwhWithSub: 0.49,
    notes: "Réseau en expansion France & Europe du Sud.",
  },
  {
    id: "iecharge",
    name: "IEcharge",
    type: "AC/DC",
    powerKw: "7–150 kW",
    subscriptionMonthly: 6.00,    // € / mois
    pricePerKwhNoSub: 0.45,       // € / kWh sans abonnement
    pricePerKwhWithSub: 0.35,     // € / kWh avec abonnement
    notes: "Réseau français indépendant. Bon rapport qualité/prix.",
  },
];
