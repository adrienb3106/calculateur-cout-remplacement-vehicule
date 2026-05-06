import {
  DEFAULT_ENERGY_INFLATION_RATE,
  DEFAULT_SUBSCRIPTION_HORIZON_MONTHS,
  getAverageElectricConsumption,
  getBestResidenceChargingOffer,
  getDepreciationRate,
  getEnergyUsageBreakdown,
  getFinancing,
  getOwnershipCost,
  getTotalUsageCost,
} from "../utils/calculations";

function safe(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrency(value) {
  return `${safe(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

function formatNumber(value, digits = 1) {
  return safe(value).toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatInteger(value) {
  return Math.round(safe(value)).toLocaleString("fr-FR");
}

function getVehicleLabel(type, fallback) {
  if (type === "electric") return `${fallback} électrique`;
  if (type === "thermal") return `${fallback} thermique`;
  return fallback;
}

function DetailCard({ title, formula, children }) {
  return (
    <div className="calc-detail-card">
      <h3 className="calc-detail-title">{title}</h3>
      {formula && <pre className="calc-formula">{formula}</pre>}
      <div className="calc-detail-copy">{children}</div>
    </div>
  );
}

export default function CalculationDetails({
  oldCar,
  newCar,
  oldType,
  newType,
  finance,
  kmCity,
  kmHighway,
}) {
  const oldVehicle = { ...oldCar, type: oldType };
  const newVehicle = { ...newCar, type: newType };

  const annualKmCity = safe(kmCity);
  const annualKmHighway = safe(kmHighway);
  const annualKmTotal = annualKmCity + annualKmHighway;

  const oldEnergy = getEnergyUsageBreakdown(oldVehicle, annualKmCity, annualKmHighway);
  const newEnergy = getEnergyUsageBreakdown(newVehicle, annualKmCity, annualKmHighway);
  const oldUsage = getTotalUsageCost(oldVehicle, annualKmCity, annualKmHighway);
  const newUsage = getTotalUsageCost(newVehicle, annualKmCity, annualKmHighway);
  const financing = getFinancing({ ...finance, price: newCar.purchasePrice });

  const chargerCost =
    newVehicle.type === "electric" && newVehicle.chargingSetup === "individual"
      ? safe(newVehicle.chargerCost)
      : 0;

  const automaticElectricVehicle =
    newType === "electric" ? newVehicle : oldType === "electric" ? oldVehicle : null;

  const page2ImportedConsumption = automaticElectricVehicle
    ? getAverageElectricConsumption(
        automaticElectricVehicle.cityConsumption,
        automaticElectricVehicle.highwayConsumption,
        annualKmCity,
        0
      ) || safe(automaticElectricVehicle.cityConsumption)
    : 0;

  const page2WeeklyKm = annualKmCity ? Math.round(annualKmCity / 52) : Math.round(6000 / 52);
  const page2YearlyKm = page2WeeklyKm * 52;
  const page2MonthlyKm = page2YearlyKm / 12;
  const page2MonthlyKwh = (page2MonthlyKm / 100) * safe(page2ImportedConsumption);
  const page2YearlyKwh = page2MonthlyKwh * 12;

  const newResidenceOffer =
    newVehicle.type === "electric" && newVehicle.chargingSetup === "residence"
      ? getBestResidenceChargingOffer(
          newVehicle,
          annualKmCity,
          annualKmHighway,
          DEFAULT_SUBSCRIPTION_HORIZON_MONTHS
        )
      : null;

  const annualDepreciationRate = getDepreciationRate(newType, annualKmTotal);
  const horizonMonths = safe(finance.duration) || DEFAULT_SUBSCRIPTION_HORIZON_MONTHS;
  const oldOwnership = getOwnershipCost({
    vehicle: oldVehicle,
    kmCity: annualKmCity,
    kmHighway: annualKmHighway,
    horizonMonths,
    mode: "keep",
  });
  const newOwnership = getOwnershipCost({
    vehicle: newVehicle,
    kmCity: annualKmCity,
    kmHighway: annualKmHighway,
    finance: { ...finance, price: newCar.purchasePrice },
    horizonMonths,
    mode: "acquire",
    oneShotCosts: chargerCost,
    tradeInValue: finance.withTradeIn ? finance.tradeIn : 0,
    retainedVehicle: finance.withTradeIn ? null : oldVehicle,
  });
  const ownershipGap = newOwnership.netCost - oldOwnership.netCost;
  const cashGap = newOwnership.horizonTotal - oldOwnership.horizonTotal;
  const oldMonthlyCost = oldUsage.monthly;
  const newMonthlyCostWithLoan = newUsage.monthly + financing.monthlyLoan;
  const newMonthlyCostAfterLoan = newUsage.monthly;
  const monthlyGapWithLoan = newMonthlyCostWithLoan - oldMonthlyCost;
  const monthlyGapAfterLoan = newMonthlyCostAfterLoan - oldMonthlyCost;

  return (
    <div>
      <div className="card">
        <h2>Principes généraux</h2>
        <p className="card-copy">
          Cette page décrit les calculs réellement utilisés par le logiciel. Les exemples chiffrés ci-dessous
          sont basés sur vos valeurs actuellement saisies dans l'application.
        </p>
      </div>

      <div className="calc-kpi-grid">
        <div className="calc-kpi">
          <span className="calc-kpi-label">Km ville / an</span>
          <strong>{formatInteger(annualKmCity)} km</strong>
        </div>
        <div className="calc-kpi">
          <span className="calc-kpi-label">Km autoroute / an</span>
          <strong>{formatInteger(annualKmHighway)} km</strong>
        </div>
        <div className="calc-kpi">
          <span className="calc-kpi-label">Km totaux / an</span>
          <strong>{formatInteger(annualKmTotal)} km</strong>
        </div>
        <div className="calc-kpi">
          <span className="calc-kpi-label">Prêt calculé</span>
          <strong>{formatCurrency(financing.monthlyLoan)} / mois</strong>
        </div>
      </div>

      <div className="card">
        <h2>Page 1 · Comparateur de coût</h2>
        <p className="card-copy">
          La page 1 calcule un coût annuel d'usage par véhicule, puis le ramène au mois. Le financement est
          ajouté ensuite pour le véhicule neuf.
        </p>

        <div className="calc-detail-grid">
          <DetailCard
            title={getVehicleLabel(oldType, "Véhicule actuel")}
            formula={`énergie annuelle = (conso ville / 100 × km ville) + (conso autoroute / 100 × km autoroute)\ncoût annuel = énergie annuelle × prix énergie`}
          >
            <p>
              Coût énergie annuel actuel : <strong>{formatCurrency(oldEnergy.energyYearly)}</strong>
            </p>
            <p>
              Entretien annuel actuel : <strong>{formatCurrency(oldUsage.maintenance)}</strong>
            </p>
            <p>
              Assurance annuelle actuelle : <strong>{formatCurrency(oldUsage.insurance)}</strong>
            </p>
            <p>
              Total annuel actuel : <strong>{formatCurrency(oldUsage.yearly)}</strong>
            </p>
          </DetailCard>

          <DetailCard
            title={getVehicleLabel(newType, "Véhicule neuf")}
            formula={`total annuel = coût énergie annuel + abonnement recharge éventuel + entretien\nmensuel = total annuel / 12`}
          >
            <p>
              Coût énergie annuel neuf : <strong>{formatCurrency(newEnergy.energyYearly)}</strong>
            </p>
            <p>
              Abonnement recharge annuel : <strong>{formatCurrency(newEnergy.subscriptionYearly)}</strong>
            </p>
            <p>
              Entretien annuel neuf : <strong>{formatCurrency(newUsage.maintenance)}</strong>
            </p>
            <p>
              Assurance annuelle neuf : <strong>{formatCurrency(newUsage.insurance)}</strong>
            </p>
            <p>
              Total annuel neuf : <strong>{formatCurrency(newUsage.yearly)}</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Inflation énergie"
            formula={`coût énergie horizon = énergie année 1 × (1 + ${formatNumber(DEFAULT_ENERGY_INFLATION_RATE * 100, 0)} %) année par année`}
          >
            <p>
              Les montants mensuels affichent le coût courant. Les coûts horizon et la rentabilité appliquent une inflation interne de <strong>{formatNumber(DEFAULT_ENERGY_INFLATION_RATE * 100, 0)} % / an</strong> sur le carburant et l'électricité.
            </p>
          </DetailCard>

          <DetailCard
            title="Recharge en résidence"
            formula={`pour chaque offre :\ncoût annuel = énergie annuelle × prix pondéré HC/HP + abonnement annualisé sur ${DEFAULT_SUBSCRIPTION_HORIZON_MONTHS} mois\nl'offre retenue = celle dont le coût annuel moyen est le plus bas`}
          >
            <p>
              Cette logique s'applique seulement si le véhicule neuf électrique est en mode
              <strong> borne en résidence</strong>.
            </p>
            <p>
              Les mois promotionnels et les mois pleins sont donc lissés avant comparaison.
            </p>
            <p>
              {newResidenceOffer
                ? `Offre actuellement retenue : ${newResidenceOffer.label} pour ${formatCurrency(newResidenceOffer.totalYearly)} / an en moyenne.`
                : "Aucune offre résidence n'est retenue actuellement dans votre saisie."}
            </p>
          </DetailCard>

          <DetailCard
            title="Entretien"
            formula={`base thermique = (km annuels / 100) × 6\nbase électrique = (km annuels / 100) × 2\nentretien annuel = base × coefficient âge/kilométrage`}
          >
            <p>
              Le logiciel part d'un coût forfaitaire pour 100 km, puis applique automatiquement un coefficient si le véhicule est ancien ou fortement kilométré.
            </p>
            <p>
              Coefficient actuel : <strong>{formatNumber(oldUsage.maintenanceFactor, 2)}</strong>
            </p>
            <p>
              Coefficient neuf : <strong>{formatNumber(newUsage.maintenanceFactor, 2)}</strong>
            </p>
            <p>
              Actuel : <strong>{formatCurrency(oldUsage.maintenance)}</strong> par an.
            </p>
            <p>
              Neuf : <strong>{formatCurrency(newUsage.maintenance)}</strong> par an.
            </p>
          </DetailCard>
        </div>
      </div>

      <div className="card">
        <h2>Financement et borne</h2>
        <p className="card-copy">
          Le prix financé part du prix du véhicule neuf, puis soustrait négociation, apport, aides et reprise.
          La mensualité est calculée avec la formule d'annuité classique.
        </p>

        <div className="calc-detail-grid">
          <DetailCard
            title="Prix financé"
            formula={`prix financé = prix neuf - négociation - aides - apport - reprise éventuelle`}
          >
            <p>
              Prix financé actuel : <strong>{formatCurrency(financing.finalPrice)}</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Mensualité"
            formula={`si taux = 0 : mensualité = capital / durée\nsinon : mensualité = capital × r / (1 - (1 + r)^-n)`}
          >
            <p>
              Mensualité calculée : <strong>{formatCurrency(financing.monthlyLoan)} / mois</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Borne individuelle page 1"
            formula={`affichage mensuel = borne affichée comme dépense unique\nrentabilité mensuelle = borne exclue du seuil\nbilan possession = borne incluse dans le cash horizon`}
          >
            <p>
              Coût de borne actuellement retenu : <strong>{formatCurrency(chargerCost)}</strong>
            </p>
            <p>
              Si vous laissez <strong>0</strong>, la borne n'est pas incluse. Si elle est renseignée, elle reste visible comme coût unique et elle entre dans le bilan de possession, mais pas dans le seuil de rentabilité mensuelle.
            </p>
          </DetailCard>

          <DetailCard
            title="Bilan de possession"
            formula={`ancien = cash horizon + perte de valeur\nnouveau = cash horizon + dette restante - valeur résiduelle + actif cédé ou conservé\nécart possession = nouveau - ancien`}
          >
            <p>
              Horizon actuellement retenu : <strong>{formatInteger(horizonMonths)} mois</strong>
            </p>
            <p>
              Ancien véhicule : <strong>{formatCurrency(oldOwnership.netCost)}</strong>
            </p>
            <p>
              Nouveau véhicule : <strong>{formatCurrency(newOwnership.netCost)}</strong>
            </p>
            <p>
              Bilan possession : <strong>{ownershipGap > 0 ? "+" : ""}{formatCurrency(ownershipGap)}</strong>
            </p>
            <p>
              Écart cash seul : <strong>{cashGap > 0 ? "+" : ""}{formatCurrency(cashGap)}</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Détail ancien véhicule"
            formula={`cash horizon = énergie avec inflation + abonnement + entretien + assurance\ncoût net ancien = cash horizon + perte de valeur`}
          >
            <p>
              Énergie avec inflation : <strong>{formatCurrency(oldOwnership.cash.energyTotal)}</strong>
            </p>
            <p>
              Abonnement : <strong>{formatCurrency(oldOwnership.cash.subscriptionTotal)}</strong>
            </p>
            <p>
              Entretien : <strong>{formatCurrency(oldOwnership.cash.maintenanceTotal)}</strong>
            </p>
            <p>
              Assurance : <strong>{formatCurrency(oldOwnership.cash.insuranceTotal)}</strong>
            </p>
            <p>
              Cash horizon : <strong>{formatCurrency(oldOwnership.horizonTotal)}</strong>
            </p>
            <p>
              Perte de valeur : <strong>{formatCurrency(oldOwnership.valueLoss)}</strong>
            </p>
            <p>
              Total possession ancien : <strong>{formatCurrency(oldOwnership.netCost)}</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Détail nouveau véhicule"
            formula={`cash horizon = énergie avec inflation + abonnement + entretien + assurance + prêt + apport + borne\ncoût net nouveau = cash horizon + dette restante - valeur résiduelle + reprise ou ancien conservé`}
          >
            <p>
              Énergie avec inflation : <strong>{formatCurrency(newOwnership.cash.energyTotal)}</strong>
            </p>
            <p>
              Abonnement : <strong>{formatCurrency(newOwnership.cash.subscriptionTotal)}</strong>
            </p>
            <p>
              Entretien : <strong>{formatCurrency(newOwnership.cash.maintenanceTotal)}</strong>
            </p>
            <p>
              Assurance : <strong>{formatCurrency(newOwnership.cash.insuranceTotal)}</strong>
            </p>
            <p>
              Prêt payé sur l'horizon : <strong>{formatCurrency(newOwnership.cash.loanTotal)}</strong>
            </p>
            <p>
              Apport : <strong>{formatCurrency(newOwnership.cash.downPaymentTotal)}</strong>
            </p>
            <p>
              Borne et coûts uniques : <strong>{formatCurrency(newOwnership.cash.oneShotTotal)}</strong>
            </p>
            <p>
              Achat comptant hors prêt : <strong>{formatCurrency(newOwnership.cash.upfrontPurchaseTotal)}</strong>
            </p>
            <p>
              Cash horizon : <strong>{formatCurrency(newOwnership.horizonTotal)}</strong>
            </p>
            <p>
              Capital restant dû : <strong>{formatCurrency(newOwnership.remainingLoanBalance)}</strong>
            </p>
            <p>
              Valeur résiduelle nouveau : <strong>-{formatCurrency(newOwnership.residualValue)}</strong>
            </p>
            <p>
              Valeur de reprise cédée : <strong>{formatCurrency(newOwnership.tradeInOpportunityCost)}</strong>
            </p>
            <p>
              Décote ancien conservé : <strong>{formatCurrency(newOwnership.retainedValueLoss)}</strong>
            </p>
            <p>
              Total possession nouveau : <strong>{formatCurrency(newOwnership.netCost)}</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Lecture de la rentabilité"
            formula={`ancien cumulé = mensualité ancien × nombre de mois\nnouveau cumulé = mensualité nouveau hors prêt × nombre de mois + mensualité prêt × mois de prêt payés\nseuil = première année où nouveau cumulé <= ancien cumulé`}
          >
            <p>
              Écart mensuel avec prêt : <strong>{monthlyGapWithLoan > 0 ? "+" : ""}{formatCurrency(monthlyGapWithLoan)} / mois</strong>
            </p>
            <p>
              Écart mensuel après prêt : <strong>{monthlyGapAfterLoan > 0 ? "+" : ""}{formatCurrency(monthlyGapAfterLoan)} / mois</strong>
            </p>
            <p>
              La courbe de rentabilité affichée utilise uniquement cette comparaison mensuelle. Les coûts ponctuels, la reprise, la valeur résiduelle et la dette restante restent visibles dans le bilan de possession, mais ne déclenchent plus le seuil de rentabilité.
            </p>
            <p>
              Bilan de possession indicatif : <strong>{ownershipGap > 0 ? "+" : ""}{formatCurrency(ownershipGap)}</strong>. Écart cash horizon indicatif : <strong>{cashGap > 0 ? "+" : ""}{formatCurrency(cashGap)}</strong>.
            </p>
          </DetailCard>
        </div>
      </div>

      <div className="card">
        <h2>Décote</h2>
        <p className="card-copy">
          La courbe de décote reconstruit une valeur à l'immatriculation, puis applique un taux annuel décroissant
          jusqu'aux années futures affichées.
        </p>

        <div className="calc-detail-grid">
          <DetailCard
            title="Taux annuel"
            formula={`base thermique = 15 %\nbase électrique = 20 %\nmajoration kilométrique = +2 points par tranche de 10 000 km/an au-dessus de 15 000\nplafond = 40 %`}
          >
            <p>
              Taux annuel actuellement appliqué au véhicule neuf :{" "}
              <strong>{formatNumber(annualDepreciationRate * 100, 1)} %</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Projection"
            formula={`valeur année N = valeur immatriculation × (1 - taux)^âge`}
          >
            <p>
              La page de décote affiche ensuite cette projection année par année, avec repères achat et année
              courante.
            </p>
          </DetailCard>

          <DetailCard
            title="Valeur résiduelle"
            formula={`perte de valeur = valeur actuelle estimée - valeur résiduelle à horizon`}
          >
            <p>
              Valeur résiduelle ancien véhicule : <strong>{formatCurrency(oldOwnership.residualValue)}</strong>
            </p>
            <p>
              Valeur résiduelle nouveau véhicule : <strong>{formatCurrency(newOwnership.residualValue)}</strong>
            </p>
          </DetailCard>
        </div>
      </div>

      <div className="card">
        <h2>Page 2 · Recharge et rentabilité VE</h2>
        <p className="card-copy">
          La page 2 est volontairement centrée sur l'usage quotidien. Elle utilise le kilométrage ville et exclut
          l'autoroute de ses calculs.
        </p>

        <div className="calc-detail-grid">
          <DetailCard
            title="Consommation importée"
            formula={`conso page 2 = conso moyenne du VE sur le kilométrage ville uniquement`}
          >
            <p>
              Consommation VE reprise pour la page 2 :{" "}
              <strong>{page2ImportedConsumption ? `${formatNumber(page2ImportedConsumption)} kWh/100 km` : "non disponible"}</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Kilométrage quotidien"
            formula={`km hebdo = km ville annuel / 52\nkm annuel page 2 = km hebdo × 52`}
          >
            <p>
              Base hebdomadaire actuelle : <strong>{formatInteger(page2WeeklyKm)} km / semaine</strong>
            </p>
            <p>
              Base annuelle actuelle : <strong>{formatInteger(page2YearlyKm)} km / an</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Énergie de recharge"
            formula={`kWh mensuels = (km mensuels / 100) × conso VE\ncoût énergie = kWh × prix du kWh`}
          >
            <p>
              Énergie mensuelle estimée : <strong>{formatNumber(page2MonthlyKwh)} kWh</strong>
            </p>
            <p>
              Énergie annuelle estimée : <strong>{formatNumber(page2YearlyKwh)} kWh</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Classement des offres"
            formula={`coût lissé mensuel = énergie mensuelle + abonnement mensuel + borne amortie éventuelle\nla meilleure offre = coût lissé mensuel minimal`}
          >
            <p>
              La page 2 compare les offres résidence et la borne individuelle de référence sur cette base, selon
              l'horizon d'analyse saisi.
            </p>
            <p>
              Le kilométrage autoroute est exclu de cette page. L'énergie est lissée sur l'horizon avec la même inflation interne que la page 1.
            </p>
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
