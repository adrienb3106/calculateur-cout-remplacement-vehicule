import {
  getAverageElectricConsumption,
  getBestResidenceChargingOffer,
  getEnergyUsageBreakdown,
  getFinancing,
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

function getDepreciationRate(type, annualKm) {
  const baseRate = type === "electric" ? 0.2 : 0.15;
  const kmPenalty = Math.max(0, (safe(annualKm) - 15000) / 10000) * 0.02;
  return Math.min(0.4, baseRate + kmPenalty);
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
      ? getBestResidenceChargingOffer(newVehicle, annualKmCity, annualKmHighway)
      : null;

  const annualDepreciationRate = getDepreciationRate(newType, annualKmTotal);

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
              Total annuel neuf : <strong>{formatCurrency(newUsage.yearly)}</strong>
            </p>
          </DetailCard>

          <DetailCard
            title="Recharge en résidence"
            formula={`pour chaque offre :\ncoût annuel = énergie annuelle × prix pondéré HC/HP + abonnement annuel\nl'offre retenue = celle dont le coût annuel est le plus bas`}
          >
            <p>
              Cette logique s'applique seulement si le véhicule neuf électrique est en mode
              <strong> borne en résidence</strong>.
            </p>
            <p>
              {newResidenceOffer
                ? `Offre actuellement retenue : ${newResidenceOffer.label} pour ${formatCurrency(newResidenceOffer.totalYearly)} / an.`
                : "Aucune offre résidence n'est retenue actuellement dans votre saisie."}
            </p>
          </DetailCard>

          <DetailCard
            title="Entretien"
            formula={`entretien annuel thermique = (km annuels / 100) × 6\nentretien annuel électrique = (km annuels / 100) × 2`}
          >
            <p>
              Le logiciel calcule l'entretien à partir du kilométrage annuel total et d'un coût forfaitaire pour 100 km selon la motorisation.
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
            formula={`sur la page 1, le coût de borne n'entre pas dans le prêt\nil est affiché à part comme dépense unique si renseigné`}
          >
            <p>
              Coût de borne actuellement retenu : <strong>{formatCurrency(chargerCost)}</strong>
            </p>
            <p>
              Si vous laissez <strong>0</strong>, la borne n'est pas incluse dans les résultats de la page 1.
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
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
