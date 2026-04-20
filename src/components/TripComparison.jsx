import { useState } from "react";
import { operators } from "../data/chargingOperators";

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function fmt(n) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function pct(electric, thermal) {
  if (!thermal) return null;
  const diff = ((electric - thermal) / thermal) * 100;
  return diff;
}

export default function TripComparison() {
  const [distance, setDistance] = useState(() => load("trip_distance", 300));
  const [fuelConsumption, setFuelConsumption] = useState(() => load("trip_fuelConso", 7));
  const [fuelPrice, setFuelPrice] = useState(() => load("trip_fuelPrice", 1.75));
  const [evConsumption, setEvConsumption] = useState(() => load("trip_evConso", 18));
  const [showSub, setShowSub] = useState(() => load("trip_showSub", true));

  function handleDistance(v) { const n = parseFloat(v) || 0; setDistance(n); save("trip_distance", n); }
  function handleFuelConso(v) { const n = parseFloat(v) || 0; setFuelConsumption(n); save("trip_fuelConso", n); }
  function handleFuelPrice(v) { const n = parseFloat(v) || 0; setFuelPrice(n); save("trip_fuelPrice", n); }
  function handleEvConso(v) { const n = parseFloat(v) || 0; setEvConsumption(n); save("trip_evConso", n); }
  function handleShowSub(v) { setShowSub(v); save("trip_showSub", v); }

  const thermalCost = (distance / 100) * fuelConsumption * fuelPrice;
  const kwhNeeded = (distance / 100) * evConsumption;

  const rows = operators.map((op) => {
    const costNoSub = kwhNeeded * op.pricePerKwhNoSub;
    const costWithSub = kwhNeeded * op.pricePerKwhWithSub;
    return { ...op, costNoSub, costWithSub };
  });

  const activeCost = (row) => showSub ? row.costWithSub : row.costNoSub;

  const sorted = [...rows].sort((a, b) => activeCost(a) - activeCost(b));

  return (
    <div>
      {/* Inputs */}
      <div className="card">
        <h2>Paramètres du trajet</h2>

        <div className="trip-inputs-grid">
          <div className="trip-input-group">
            <p className="section-label">Thermique</p>
            <div className="field-row">
              <label>Distance (km)</label>
              <div className="field-input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  value={distance}
                  onChange={(e) => handleDistance(e.target.value)}
                />
              </div>
            </div>
            <div className="field-row">
              <label>Conso (L/100km)</label>
              <div className="field-input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fuelConsumption}
                  onChange={(e) => handleFuelConso(e.target.value)}
                />
              </div>
            </div>
            <div className="field-row">
              <label>Prix carburant (€/L)</label>
              <div className="field-input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fuelPrice}
                  onChange={(e) => handleFuelPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="trip-thermal-result">
              <span className="trip-thermal-label">Coût thermique</span>
              <span className="trip-thermal-value">{fmt(thermalCost)}</span>
            </div>
          </div>

          <div className="trip-input-group">
            <p className="section-label">Électrique</p>
            <div className="field-row">
              <label>Distance (km)</label>
              <div className="field-input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  value={distance}
                  onChange={(e) => handleDistance(e.target.value)}
                />
              </div>
            </div>
            <div className="field-row">
              <label>Conso (kWh/100km)</label>
              <div className="field-input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  value={evConsumption}
                  onChange={(e) => handleEvConso(e.target.value)}
                />
              </div>
            </div>
            <div className="trip-ev-info">
              <span className="trip-thermal-label">Énergie nécessaire</span>
              <span className="trip-thermal-value">{kwhNeeded.toFixed(1)} kWh</span>
            </div>
          </div>
        </div>

        {/* Toggle abonnement */}
        <div className="trip-sub-toggle">
          <span className="section-label" style={{ margin: 0 }}>Afficher avec abonnement ?</span>
          <div className="toggle-group" style={{ marginBottom: 0, maxWidth: 260 }}>
            <button
              className={showSub ? "toggle active" : "toggle"}
              onClick={() => handleShowSub(true)}
            >
              Avec abonnement
            </button>
            <button
              className={!showSub ? "toggle active" : "toggle"}
              onClick={() => handleShowSub(false)}
            >
              Sans abonnement
            </button>
          </div>
        </div>
      </div>

      {/* Tableau comparatif */}
      <div className="card">
        <h2>Comparaison par opérateur</h2>
        <p className="trip-subtitle">
          Coût pour {distance} km · {kwhNeeded.toFixed(1)} kWh nécessaires
          {showSub && " · abonnement non inclus dans le coût trajet"}
        </p>

        <div className="trip-table-wrap">
          <table className="trip-table">
            <thead>
              <tr>
                <th>Opérateur</th>
                <th>Type</th>
                <th>Puissance</th>
                {showSub && <th>Abo. mensuel</th>}
                <th>€/kWh {showSub ? "(avec abo)" : "(sans abo)"}</th>
                <th>Coût trajet</th>
                <th>vs Thermique</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const cost = activeCost(row);
                const diff = pct(cost, thermalCost);
                const isCheaper = diff !== null && diff < 0;
                const isEqual = diff !== null && Math.abs(diff) < 1;
                return (
                  <tr key={row.id}>
                    <td className="trip-op-name">
                      {row.name}
                      {row.notes && (
                        <span className="trip-op-note">{row.notes}</span>
                      )}
                    </td>
                    <td className="trip-center">{row.type}</td>
                    <td className="trip-center trip-dim">{row.powerKw}</td>
                    {showSub && (
                      <td className="trip-right">
                        {row.subscriptionMonthly > 0
                          ? row.subscriptionMonthly.toFixed(2).replace(".", ",") + " €/mois"
                          : <span className="trip-free">Gratuit</span>}
                      </td>
                    )}
                    <td className="trip-right trip-kwh">
                      {(showSub ? row.pricePerKwhWithSub : row.pricePerKwhNoSub)
                        .toFixed(2)
                        .replace(".", ",")} €
                    </td>
                    <td className="trip-right trip-cost">{fmt(cost)}</td>
                    <td className="trip-right">
                      {diff === null || !thermalCost ? (
                        "—"
                      ) : isEqual ? (
                        <span className="trip-badge trip-badge-neutral">≈ égal</span>
                      ) : isCheaper ? (
                        <span className="trip-badge trip-badge-good">
                          {Math.abs(diff).toFixed(0)} % moins cher
                        </span>
                      ) : (
                        <span className="trip-badge trip-badge-bad">
                          +{diff.toFixed(0)} % plus cher
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Ligne référence thermique */}
              <tr className="trip-row-thermal">
                <td className="trip-op-name">
                  Thermique (référence)
                  <span className="trip-op-note">
                    {fuelConsumption} L/100km · {fuelPrice.toFixed(2).replace(".", ",")} €/L
                  </span>
                </td>
                <td className="trip-center">—</td>
                <td className="trip-center trip-dim">—</td>
                {showSub && <td className="trip-right">—</td>}
                <td className="trip-right trip-dim">
                  {fuelPrice.toFixed(2).replace(".", ",")} €/L
                </td>
                <td className="trip-right trip-cost">{fmt(thermalCost)}</td>
                <td className="trip-right">
                  <span className="trip-badge trip-badge-neutral">Référence</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {showSub && (
          <p className="trip-disclaimer">
            * Le coût mensuel de l'abonnement n'est pas inclus dans le "Coût trajet" — il est affiché séparément.
            Pour amortir un abonnement, comparez le nombre de trajets mensuels nécessaires.
          </p>
        )}
      </div>
    </div>
  );
}
