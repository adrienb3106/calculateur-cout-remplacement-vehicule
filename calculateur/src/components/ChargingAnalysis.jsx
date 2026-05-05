import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import chargingOffers from "../../tarifs.json";
import {
  getAverageElectricConsumption,
  getBlendedElectricityPrice,
  getChargingStationPrice,
  getSubscriptionCostForMonths,
  getTotalUsageCost,
} from "../utils/calculations";

const CHART_COLORS = {
  energy: "#2563eb",
  subscription: "#f59e0b",
  charger: "#fb7185",
  maintenance: "#10b981",
};

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function safe(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function hasPositive(value) {
  return safe(value) > 0;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round((safe(value) + Number.EPSILON) * factor) / factor;
}

function formatCurrency(value) {
  return `${safe(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

function formatCompactCurrency(value) {
  return `${Math.round(safe(value)).toLocaleString("fr-FR")} €`;
}

function formatNumber(value, digits = 1) {
  return safe(value).toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="charging-chart-tooltip">
      <p className="charging-chart-tooltip-title">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="charging-chart-tooltip-line" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
      <p className="charging-chart-tooltip-total">
        Total: {formatCurrency(payload.reduce((sum, entry) => sum + safe(entry.value), 0))}
      </p>
    </div>
  );
}

function CurrentVehicleTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const visible = payload.filter((entry) => safe(entry.value) > 0);
  if (!visible.length) return null;

  return (
    <div className="charging-chart-tooltip">
      <p className="charging-chart-tooltip-title">{label}</p>
      {visible.map((entry) => (
        <p key={entry.dataKey} className="charging-chart-tooltip-line" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
      <p className="charging-chart-tooltip-total">
        Total: {formatCurrency(visible.reduce((sum, entry) => sum + safe(entry.value), 0))}
      </p>
    </div>
  );
}

function NumberField({ label, value, onChange, integer = false, suffix, hint }) {
  const [raw, setRaw] = useState(value || value === 0 ? String(value) : "");
  const [error, setError] = useState(false);

  useEffect(() => {
    setRaw(value || value === 0 ? String(value) : "");
  }, [value]);

  function handleChange(event) {
    const input = event.target.value;
    const normalized = input.replace(/,/g, ".");
    setRaw(input);

    if (input === "") {
      setError(false);
      onChange(0);
      return;
    }

    const numeric = integer ? parseInt(normalized, 10) : parseFloat(normalized);
    if (Number.isNaN(numeric)) {
      setError(true);
      return;
    }

    setError(false);
    onChange(numeric);
  }

  return (
    <div className="field-col">
      <label className="field-col-label">{label}</label>
      <input
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        value={raw}
        onChange={handleChange}
        className={error ? "field-input-error" : ""}
      />
      {suffix && <span className="charging-input-suffix">{suffix}</span>}
      {error && <span className="field-error-msg">Valeur invalide</span>}
      {hint && !error && <span className="charging-input-hint">{hint}</span>}
    </div>
  );
}

function getVehicleChoices(oldCar, newCar, oldType, newType) {
  const choices = [];

  if (newType === "electric") {
    choices.push({
      id: "new",
      label: "Nouveau véhicule électrique",
      vehicle: { ...newCar, type: newType },
    });
  }

  if (oldType === "electric") {
    choices.push({
      id: "old",
      label: "Véhicule actuel électrique",
      vehicle: { ...oldCar, type: oldType },
    });
  }

  choices.push({
    id: "manual",
    label: "Saisie manuelle",
    vehicle: null,
  });

  return choices;
}

export default function ChargingAnalysis({
  oldCar,
  newCar,
  oldType,
  newType,
  kmCity,
  kmHighway,
}) {
  const annualKmFromApp = safe(kmCity) + safe(kmHighway);
  const defaultWeeklyKm = annualKmFromApp ? round(annualKmFromApp / 52, 0) : round(6000 / 52, 0);
  const vehicleChoices = useMemo(
    () => getVehicleChoices(oldCar, newCar, oldType, newType),
    [oldCar, newCar, oldType, newType]
  );
  const automaticElectricVehicle = useMemo(() => {
    if (newType === "electric") return newCar;
    if (oldType === "electric") return oldCar;
    return null;
  }, [newCar, newType, oldCar, oldType]);

  const defaultChoice = vehicleChoices[0]?.id || "manual";
  const [vehicleSource, setVehicleSource] = useState(() => load("charging_vehicle_source", defaultChoice));
  const [weeklyKm, setWeeklyKm] = useState(() => load("charging_weekly_km", defaultWeeklyKm));
  const [evConsumption, setEvConsumption] = useState(() => load("charging_ev_consumption", 18));
  const [offPeakShare, setOffPeakShare] = useState(() => load("charging_off_peak_share", 80));
  const [horizonMonths, setHorizonMonths] = useState(() => load("charging_horizon_months", 36));
  const [chargerTiming, setChargerTiming] = useState(() => load("charging_charger_timing", "after"));
  const [includeCharger, setIncludeCharger] = useState(() => load("charging_include_charger", true));
  const [selectedOfferId, setSelectedOfferId] = useState(() => load("charging_offer_id", ""));
  const [comparisonMode, setComparisonMode] = useState(() => load("charging_comparison_mode", "full"));

  useEffect(() => {
    if (!vehicleChoices.some((choice) => choice.id === vehicleSource)) {
      setVehicleSource(defaultChoice);
    }
  }, [defaultChoice, vehicleChoices, vehicleSource]);

  const selectedSource = vehicleChoices.find((choice) => choice.id === vehicleSource) || vehicleChoices[0];
  const sourceVehicle = selectedSource?.vehicle || null;
  const importedConsumption = sourceVehicle
    ? round(
        getAverageElectricConsumption(
          sourceVehicle.cityConsumption,
          sourceVehicle.highwayConsumption,
          kmCity,
          kmHighway
        ) || sourceVehicle.cityConsumption || sourceVehicle.highwayConsumption || 18,
        1
      )
    : 18;

  useEffect(() => {
    if (sourceVehicle) {
      setEvConsumption(importedConsumption);
    }
  }, [importedConsumption, sourceVehicle]);

  useEffect(() => {
    if (annualKmFromApp) {
      setWeeklyKm(round(annualKmFromApp / 52, 0));
    }
  }, [annualKmFromApp]);

  useEffect(() => { save("charging_vehicle_source", vehicleSource); }, [vehicleSource]);
  useEffect(() => { save("charging_weekly_km", weeklyKm); }, [weeklyKm]);
  useEffect(() => { save("charging_ev_consumption", evConsumption); }, [evConsumption]);
  useEffect(() => { save("charging_off_peak_share", offPeakShare); }, [offPeakShare]);
  useEffect(() => { save("charging_horizon_months", horizonMonths); }, [horizonMonths]);
  useEffect(() => { save("charging_charger_timing", chargerTiming); }, [chargerTiming]);
  useEffect(() => { save("charging_include_charger", includeCharger); }, [includeCharger]);
  useEffect(() => { save("charging_offer_id", selectedOfferId); }, [selectedOfferId]);
  useEffect(() => { save("charging_comparison_mode", comparisonMode); }, [comparisonMode]);

  const yearlyKm = safe(weeklyKm) * 52;
  const monthlyKm = yearlyKm / 12;
  const monthlyKwh = (monthlyKm / 100) * safe(evConsumption);
  const yearlyKwh = monthlyKwh * 12;
  const effectiveMonths = Math.max(1, Math.round(safe(horizonMonths)));
  const maintenanceYearly = getTotalUsageCost({ type: "electric" }, 0, 0).maintenance;

  const referenceVehicle = sourceVehicle
    ? {
        ...sourceVehicle,
        type: "electric",
        cityConsumption: safe(sourceVehicle.cityConsumption) || safe(evConsumption),
        highwayConsumption: safe(sourceVehicle.highwayConsumption) || safe(evConsumption),
      }
    : null;

  const referenceUsage = referenceVehicle
    ? getTotalUsageCost(
        {
          ...referenceVehicle,
          type: "electric",
          cityConsumption: safe(evConsumption),
          highwayConsumption: safe(evConsumption),
        },
        yearlyKm,
        0
      )
    : null;

  const oldUsageForWeeklyKm = oldType
    ? getTotalUsageCost(
        { ...oldCar, type: oldType },
        yearlyKm * (annualKmFromApp ? safe(kmCity) / annualKmFromApp : 0.5),
        yearlyKm * (annualKmFromApp ? safe(kmHighway) / annualKmFromApp : 0.5)
      )
    : null;

  const offerRows = useMemo(() => {
    return chargingOffers
      .map((offer) => {
        const blendedPrice = getBlendedElectricityPrice(
          offer.hc_price_eur_per_kwh,
          offer.hp_price_eur_per_kwh,
          offPeakShare
        );
        const energyMonthly = (yearlyKwh * blendedPrice) / 12;
        const energyYearly = yearlyKwh * blendedPrice;
        const subscriptionTotal = getSubscriptionCostForMonths(offer, effectiveMonths);
        const subscriptionMonthly = subscriptionTotal / effectiveMonths;
        const station = getChargingStationPrice(offer, chargerTiming);
        const chargerPrice = includeCharger ? station.price : 0;
        const chargerMonthly = chargerPrice / effectiveMonths;
        const chargingMonthly = energyMonthly + subscriptionMonthly + chargerMonthly;
        const chargingTotal = (energyMonthly * effectiveMonths) + subscriptionTotal + chargerPrice;
        const yearlySubscription = getSubscriptionCostForMonths(offer, 12);
        const usageMonthly = chargingMonthly + (maintenanceYearly / 12);
        const usageYearly = (energyYearly + yearlySubscription) + maintenanceYearly + (chargerPrice * (12 / effectiveMonths));
        const firstYearUsage = energyYearly + yearlySubscription + maintenanceYearly + chargerPrice;

        return {
          ...offer,
          blendedPrice,
          energyMonthly,
          energyYearly,
          subscriptionMonthly,
          subscriptionTotal,
          chargerPrice,
          chargerPriceExact: station.exact,
          chargerMonthly,
          chargingMonthly,
          chargingTotal,
          usageMonthly,
          usageYearly,
          firstYearUsage,
        };
      })
      .sort((left, right) => left.chargingMonthly - right.chargingMonthly);
  }, [
    chargerTiming,
    effectiveMonths,
    includeCharger,
    maintenanceYearly,
    offPeakShare,
    yearlyKwh,
  ]);

  useEffect(() => {
    if (!offerRows.length) return;
    if (!selectedOfferId || !offerRows.some((offer) => offer.id === selectedOfferId)) {
      setSelectedOfferId(offerRows[0].id);
    }
  }, [offerRows, selectedOfferId]);

  const bestOffer = offerRows[0] || null;
  const selectedOffer = offerRows.find((offer) => offer.id === selectedOfferId) || bestOffer || null;
  const summaryOffer = bestOffer;
  const providerVsOldVehicle = summaryOffer && oldUsageForWeeklyKm
    ? summaryOffer.usageMonthly - oldUsageForWeeklyKm.monthly
    : null;
  const energyOnlyVsOldVehicle = summaryOffer && oldUsageForWeeklyKm
    ? (summaryOffer.energyMonthly + summaryOffer.subscriptionMonthly) - (oldUsageForWeeklyKm.fuel / 12)
    : null;
  const monthlyMaintenance = maintenanceYearly / 12;
  const showEnergyOnlyComparison = comparisonMode === "energy";
  const displayedVsOldVehicle = showEnergyOnlyComparison ? energyOnlyVsOldVehicle : providerVsOldVehicle;

  const currentVehicleChartData = useMemo(() => {
    if (!summaryOffer || !oldUsageForWeeklyKm) return [];

    return [
      {
        name: "Véhicule actuel",
        Energie: oldUsageForWeeklyKm.fuel / 12,
        Abonnement: 0,
        Borne: 0,
        Entretien: showEnergyOnlyComparison ? 0 : oldUsageForWeeklyKm.maintenance / 12,
      },
      {
        name: "VE + meilleure offre",
        Energie: summaryOffer.energyMonthly,
        Abonnement: summaryOffer.subscriptionMonthly,
        Borne: showEnergyOnlyComparison ? 0 : summaryOffer.chargerMonthly,
        Entretien: showEnergyOnlyComparison ? 0 : monthlyMaintenance,
      },
    ];
  }, [monthlyMaintenance, oldUsageForWeeklyKm, showEnergyOnlyComparison, summaryOffer]);

  const offersChartData = useMemo(() => (
    offerRows.map((offer) => ({
      name: `${offer.provider} ${offer.offer_name}`,
      Energie: offer.energyMonthly,
      Abonnement: offer.subscriptionMonthly,
      Borne: offer.chargerMonthly,
      Entretien: monthlyMaintenance,
    }))
  ), [monthlyMaintenance, offerRows]);

  const comparatorMissingFields = useMemo(() => {
    const missing = [];

    if (!annualKmFromApp) {
      missing.push("kilométrage annuel ville et/ou autoroute");
    }

    if (!automaticElectricVehicle) {
      missing.push("un véhicule électrique sur le comparateur");
    } else {
      if (!hasPositive(automaticElectricVehicle.cityConsumption)) {
        missing.push("conso ville du véhicule électrique");
      }
      if (!hasPositive(automaticElectricVehicle.highwayConsumption)) {
        missing.push("conso autoroute du véhicule électrique");
      }
      if ((automaticElectricVehicle.chargingSetup || "individual") === "individual") {
        if (!hasPositive(automaticElectricVehicle.hcPrice)) {
          missing.push("Tarif Heure Creuse du véhicule électrique");
        }
        if (!hasPositive(automaticElectricVehicle.hpPrice)) {
          missing.push("Tarif Heure Pleine du véhicule électrique");
        }
      }
    }

    if (!hasPositive(oldCar?.cityConsumption)) {
      missing.push("conso ville du véhicule actuel");
    }
    if (!hasPositive(oldCar?.highwayConsumption)) {
      missing.push("conso autoroute du véhicule actuel");
    }
    if (!hasPositive(oldCar?.energyPrice)) {
      missing.push("prix de l'énergie du véhicule actuel");
    }

    return [...new Set(missing)];
  }, [annualKmFromApp, automaticElectricVehicle, oldCar]);

  return (
    <div>
      <div className="card">
        <h1 className="charging-page-title">Solution collective en copropriété</h1>
        <h2>Recharge du véhicule électrique</h2>

        {comparatorMissingFields.length > 0 && (
          <div className="charging-warning-box">
            <strong className="charging-warning-title">Données manquantes</strong>
            <p className="charging-warning-text">
              Saisir les valeurs suivantes sur la page Comparateur de coût pour fiabiliser les calculs de rentabilité et de recharge :
              {" "}{comparatorMissingFields.join(", ")}.
            </p>
          </div>
        )}

        <p className="section-label">Source des données VE</p>
        <div className="toggle-group">
          {vehicleChoices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={vehicleSource === choice.id ? "toggle active" : "toggle"}
              onClick={() => setVehicleSource(choice.id)}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <div className="charging-grid">
          <NumberField
            label="Conso moyenne (kWh/100 km)"
            value={evConsumption}
            onChange={setEvConsumption}
            hint={sourceVehicle ? `Valeur reprise de l'app : ${formatNumber(importedConsumption)} kWh/100` : null}
          />
          <NumberField
            label="Km moyens par semaine"
            value={weeklyKm}
            onChange={setWeeklyKm}
            integer
            hint={annualKmFromApp ? `Base app : ${Math.round(annualKmFromApp).toLocaleString("fr-FR")} km/an` : null}
          />
          <NumberField
            label="Part des recharges en heures creuses"
            value={offPeakShare}
            onChange={setOffPeakShare}
            integer
            suffix="%"
          />
          <NumberField
            label="Horizon d'analyse"
            value={horizonMonths}
            onChange={setHorizonMonths}
            integer
            suffix="mois"
          />
        </div>

        <div className="field-divider" />

        <div className="charging-inline-options">
          <div className="charging-option-block">
            <span className="field-col-label">Prix de borne à utiliser</span>
            <div className="toggle-group charging-toggle-inline">
              <button
                type="button"
                className={chargerTiming === "before" ? "toggle active" : "toggle"}
                onClick={() => setChargerTiming("before")}
              >
                Avant installation
              </button>
              <button
                type="button"
                className={chargerTiming === "after" ? "toggle active" : "toggle"}
                onClick={() => setChargerTiming("after")}
              >
                Après installation
              </button>
            </div>
          </div>

          <label className="charging-checkbox">
            <input
              type="checkbox"
              checked={includeCharger}
              onChange={(event) => setIncludeCharger(event.target.checked)}
            />
            Intégrer la borne dans la rentabilité
          </label>
        </div>

        <div className="charging-kpis">
          <div className="charging-kpi">
            <span className="charging-kpi-label">Distance mensuelle</span>
            <strong>{Math.round(monthlyKm).toLocaleString("fr-FR")} km</strong>
          </div>
          <div className="charging-kpi">
            <span className="charging-kpi-label">Distance annuelle</span>
            <strong>{Math.round(yearlyKm).toLocaleString("fr-FR")} km</strong>
          </div>
          <div className="charging-kpi">
            <span className="charging-kpi-label">Énergie / mois</span>
            <strong>{formatNumber(monthlyKwh)} kWh</strong>
          </div>
          <div className="charging-kpi">
            <span className="charging-kpi-label">Énergie / an</span>
            <strong>{Math.round(yearlyKwh).toLocaleString("fr-FR")} kWh</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="charging-section-header">
          <div>
            <h2>Classement des prestataires</h2>
            <p className="charging-section-note">
              Comparaison sur {effectiveMonths} mois avec abonnement, énergie et
              {includeCharger ? " borne incluse." : " borne exclue."}
            </p>
          </div>
          {bestOffer && (
            <span className="charging-best-badge">
              Meilleur coût lissé : {bestOffer.provider} {bestOffer.offer_name}
            </span>
          )}
        </div>

        <div className="trip-table-wrap">
          <table className="trip-table charging-offers-table">
            <thead>
              <tr>
                <th>Prestataire</th>
                <th>Prix moyen kWh</th>
                <th>Énergie / mois</th>
                <th>Abo. moyen / mois</th>
                <th>Borne</th>
                <th>Total lisse / mois</th>
                <th>Total sur {effectiveMonths} mois</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {offerRows.map((offer, index) => {
                const isBest = index === 0;
                const isSelected = selectedOffer?.id === offer.id;

                return (
                  <tr
                    key={offer.id}
                    className={`${isSelected ? "charging-row-selected" : ""} ${isBest ? "charging-row-best" : ""}`}
                  >
                    <td className="trip-op-name">
                      {offer.provider}
                      <span className="trip-op-note">
                        {offer.offer_name}
                        {offer.notes ? ` · ${offer.notes}` : ""}
                      </span>
                    </td>
                    <td className="trip-right">
                      <span className="trip-kwh">{formatCurrency(offer.blendedPrice)}</span>
                      <span className="trip-op-note">
                        HC {formatCurrency(offer.hc_price_eur_per_kwh)} · HP {formatCurrency(offer.hp_price_eur_per_kwh)}
                      </span>
                    </td>
                    <td className="trip-right trip-cost">{formatCurrency(offer.energyMonthly)}</td>
                    <td className="trip-right">{formatCurrency(offer.subscriptionMonthly)}</td>
                    <td className="trip-right">
                      {includeCharger ? formatCompactCurrency(offer.chargerPrice) : "Hors calcul"}
                      {includeCharger && !offer.chargerPriceExact && (
                        <span className="trip-op-note">prix voisin utilisé faute de valeur exacte</span>
                      )}
                    </td>
                    <td className="trip-right trip-cost">{formatCurrency(offer.chargingMonthly)}</td>
                    <td className="trip-right">{formatCompactCurrency(offer.chargingTotal)}</td>
                    <td className="trip-right">
                      <button
                        type="button"
                        className={isSelected ? "charging-select-btn active" : "charging-select-btn"}
                        onClick={() => setSelectedOfferId(offer.id)}
                      >
                        {isSelected ? "Sélectionné" : "Choisir"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {offersChartData.length > 0 && (
          <div className="charging-chart-block">
            <h3 className="charging-chart-title">Graphe de toutes les solutions</h3>
            <p className="charging-chart-subtitle">
              Coût mensuel lissé par prestataire, avec décomposition des postes.
            </p>
            <ResponsiveContainer width="100%" height={Math.max(360, offersChartData.length * 62)}>
              <BarChart
                data={offersChartData}
                layout="vertical"
                margin={{ top: 10, right: 24, left: 36, bottom: 10 }}
                barSize={32}
                barCategoryGap={18}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `${Math.round(value)} €`}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend />
                <Bar dataKey="Energie" stackId="cost" fill={CHART_COLORS.energy} />
                <Bar dataKey="Abonnement" stackId="cost" fill={CHART_COLORS.subscription} />
                <Bar dataKey="Borne" stackId="cost" fill={CHART_COLORS.charger} />
                <Bar dataKey="Entretien" stackId="cost" fill={CHART_COLORS.maintenance} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {summaryOffer && (
        <div className="card result">
          <div className="charging-section-header">
            <div>
              <h2>Rentabilité d'usage du VE</h2>
              <p className="charging-section-note">
                Synthèse avec la meilleure offre actuelle : {summaryOffer.provider} {summaryOffer.offer_name}.
              </p>
            </div>
          </div>

          <div className="charging-summary-grid">
            <div className="charging-summary-card">
              <span className="charging-summary-label">Recharge mensuelle lisse</span>
              <strong>{formatCurrency(summaryOffer.chargingMonthly)}</strong>
              <span className="charging-summary-sub">
                Énergie + abonnement + borne amortie sur {effectiveMonths} mois
              </span>
              <span className="charging-summary-sub">
                La borne est lissée sur {effectiveMonths} mois dans ce calcul.
              </span>
            </div>
            <div className="charging-summary-card">
              <span className="charging-summary-label">Usage VE / mois</span>
              <strong>{formatCurrency(summaryOffer.usageMonthly)}</strong>
              <span className="charging-summary-sub">
                Recharge lisse + entretien
              </span>
              <span className="charging-summary-sub">
                Calcul limité aux trajets quotidiens. Les recharges et pleins liés aux gros trajets ne sont pas pris en compte.
              </span>
            </div>
            <div className="charging-summary-card">
              <span className="charging-summary-label">Usage VE / an</span>
              <strong>{formatCompactCurrency(summaryOffer.usageYearly)}</strong>
              <span className="charging-summary-sub">
                Ramené en coût annuel moyen
              </span>
            </div>
            <div className="charging-summary-card">
              <span className="charging-summary-label">Dépense réelle 1ère année</span>
              <strong>{formatCompactCurrency(summaryOffer.firstYearUsage)}</strong>
              <span className="charging-summary-sub">
                Énergie + abonnement + entretien + borne
              </span>
            </div>
          </div>

          <div className="charging-comparison-grid">
            {!referenceUsage && !oldUsageForWeeklyKm && (
              <div className="charging-comparison-card charging-comparison-card-wide">
                <span className="charging-comparison-title">Base de calcul</span>
                <strong>{formatCurrency(summaryOffer.usageMonthly)} / mois</strong>
                <span className="charging-comparison-text">
                  Renseignez un VE dans l'app principale pour comparer automatiquement vos coûts d'usage.
                </span>
              </div>
            )}
          </div>

          {currentVehicleChartData.length > 0 && (
            <div className="charging-chart-block">
              <div className="charging-section-header">
                <div>
                  <h3 className="charging-chart-title">Comparaison graphique avec le véhicule actuel</h3>
                  <p className="charging-chart-subtitle">
                    {showEnergyOnlyComparison
                      ? "Vue mensuelle limitée à la recharge du VE : énergie et abonnement."
                      : "Vue mensuelle des coûts d'usage à kilométrage équivalent."}
                  </p>
                </div>
                <div className="charging-comparison-actions">
                  <div className="toggle-group charging-toggle-inline">
                    <button
                      type="button"
                      className={!showEnergyOnlyComparison ? "toggle active" : "toggle"}
                      onClick={() => setComparisonMode("full")}
                    >
                      Usage complet
                    </button>
                    <button
                      type="button"
                      className={showEnergyOnlyComparison ? "toggle active" : "toggle"}
                      onClick={() => setComparisonMode("energy")}
                    >
                      Recharge seule
                    </button>
                  </div>
                  <span className={displayedVsOldVehicle <= 0 ? "charging-best-badge" : "charging-best-badge charging-badge-negative"}>
                    Écart: {displayedVsOldVehicle > 0 ? "+" : ""}{formatCurrency(displayedVsOldVehicle)} / mois
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={currentVehicleChartData}
                  margin={{ top: 10, right: 24, left: 0, bottom: 10 }}
                  barSize={44}
                  barCategoryGap={28}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value)} €`} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CurrentVehicleTooltip />} />
                  <Legend />
                  <Bar dataKey="Energie" stackId="cost" fill={CHART_COLORS.energy} />
                  <Bar dataKey="Entretien" stackId="cost" fill={CHART_COLORS.maintenance} />
                  <Bar dataKey="Abonnement" stackId="cost" fill={CHART_COLORS.subscription} />
                  <Bar dataKey="Borne" stackId="cost" fill={CHART_COLORS.charger} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {!currentVehicleChartData.length && oldUsageForWeeklyKm && (
            <div className="charging-comparison-card charging-comparison-card-wide">
              <span className="charging-comparison-title">Vs véhicule actuel</span>
              <strong className={displayedVsOldVehicle <= 0 ? "charging-positive" : "charging-negative"}>
                {displayedVsOldVehicle <= 0 ? "" : "+"}
                {formatCurrency(displayedVsOldVehicle)}
                {" / mois"}
              </strong>
              <span className="charging-comparison-text">
                {showEnergyOnlyComparison
                  ? `Véhicule actuel, énergie seule : ${formatCurrency(oldUsageForWeeklyKm.fuel / 12)} / mois`
                  : `Véhicule actuel : ${formatCurrency(oldUsageForWeeklyKm.monthly)} / mois`}
              </span>
            </div>
          )}
          
          {currentVehicleChartData.length > 0 && (
            <div className="charging-comparison-card charging-comparison-card-wide">
              <span className="charging-comparison-title">Lecture</span>
              <span className="charging-comparison-text">
                {showEnergyOnlyComparison
                  ? "Le graphique compare le coût de recharge du VE, donc énergie et abonnement, face au coût d'énergie du véhicule actuel. Il ne porte que sur les usages quotidiens et exclut les longs trajets de l'équation."
                  : "Le graphique compare le véhicule actuel à la solution VE retenue, avec énergie, abonnement, borne amortie et entretien. Il ne porte que sur les usages quotidiens et exclut les longs trajets de l'équation."}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
