import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  getTotalUsageCost,
  getFinancing,
  getOwnershipCost,
} from "../utils/calculations";

const fmt = (v) => (Number.isFinite(v) ? v.toFixed(2) : "—");
const fmtMoney = (v) => (Number.isFinite(v) ? `${Math.round(v).toLocaleString("fr-FR")} €` : "—");

const COLORS = {
  fuel: "#3b82f6",
  subscription: "#8b5cf6",
  maintenance: "#10b981",
  insurance: "#64748b",
  loan: "#f59e0b",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill, margin: "2px 0" }}>
          {p.name} : {p.value.toFixed(2)} €/mois
        </p>
      ))}
      <p style={{ borderTop: "1px solid #e2e8f0", marginTop: 6, paddingTop: 6, fontWeight: 600 }}>
        Total : {payload.reduce((s, p) => s + p.value, 0).toFixed(2)} €/mois
      </p>
    </div>
  );
};

const cumulTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.stroke, margin: "2px 0" }}>
          {p.name} : {p.value.toLocaleString("fr-FR")} €
        </p>
      ))}
    </div>
  );
};

export default function Results({ oldCar, newCar, finance, kmCity, kmHighway }) {
  const [showCumul, setShowCumul] = useState(false);

  const oldCost = getTotalUsageCost(oldCar, kmCity, kmHighway);
  const newCost = getTotalUsageCost(newCar, kmCity, kmHighway);
  const financing = getFinancing(finance);

  const totalOld = oldCost.monthly;
  const totalNewWithLoan = newCost.monthly + financing.monthlyLoan;
  const totalNewAfterLoan = newCost.monthly;

  const diff = totalNewWithLoan - totalOld;
  const diffAfter = totalNewAfterLoan - totalOld;
  const charger = newCar.type === "electric" && newCar.chargingSetup === "individual"
    ? (Number(newCar.chargerCost) || 0)
    : 0;
  const hasChargingSubscription = oldCost.chargingSubscription > 0 || newCost.chargingSubscription > 0;
  const loanMonths = finance.duration || 0;
  const horizonMonths = loanMonths > 0 ? loanMonths : 36;
  const oldOwnership = getOwnershipCost({
    vehicle: oldCar,
    kmCity,
    kmHighway,
    horizonMonths,
    mode: "keep",
  });
  const newOwnership = getOwnershipCost({
    vehicle: newCar,
    kmCity,
    kmHighway,
    finance,
    horizonMonths,
    mode: "acquire",
    oneShotCosts: charger,
    tradeInValue: finance.withTradeIn ? finance.tradeIn : 0,
    retainedVehicle: finance.withTradeIn ? null : oldCar,
  });
  const monthlyGapWithLoan = totalNewWithLoan - totalOld;
  const monthlyGapAfterLoan = totalNewAfterLoan - totalOld;

  const chartData = [
    {
      name: "Ancien véhicule",
      Carburant: oldCost.fuel / 12,
      Abonnement: oldCost.chargingSubscription / 12,
      Entretien: oldCost.maintenance / 12,
      Assurance: oldCost.insurance / 12,
      Prêt: 0,
    },
    {
      name: "Nouveau (avec prêt)",
      Carburant: newCost.fuel / 12,
      Abonnement: newCost.chargingSubscription / 12,
      Entretien: newCost.maintenance / 12,
      Assurance: newCost.insurance / 12,
      Prêt: financing.monthlyLoan,
    },
    {
      name: "Nouveau (après prêt)",
      Carburant: newCost.fuel / 12,
      Abonnement: newCost.chargingSubscription / 12,
      Entretien: newCost.maintenance / 12,
      Assurance: newCost.insurance / 12,
      Prêt: 0,
    },
  ];

  const SEARCH_HORIZON = 25;

  function calcCumul(year) {
    const months = year * 12;
    const activeLoanMonths = Math.min(months, Math.max(0, loanMonths));
    const oldMonthlyCumul = totalOld * months;
    const newMonthlyCumul = (totalNewAfterLoan * months) + (financing.monthlyLoan * activeLoanMonths);
    const oldCumulOwnership = getOwnershipCost({
      vehicle: oldCar,
      kmCity,
      kmHighway,
      horizonMonths: months,
      mode: "keep",
    });
    const newCumulOwnership = getOwnershipCost({
      vehicle: newCar,
      kmCity,
      kmHighway,
      finance,
      horizonMonths: months,
      mode: "acquire",
      oneShotCosts: charger,
      tradeInValue: finance.withTradeIn ? finance.tradeIn : 0,
      retainedVehicle: finance.withTradeIn ? null : oldCar,
    });

    return {
      cumOld: Math.round(oldCumulOwnership.netCost),
      cumNew: Math.round(newCumulOwnership.netCost),
      monthlyOld: Math.round(oldMonthlyCumul),
      monthlyNew: Math.round(newMonthlyCumul),
    };
  }

  let ownershipBreakevenYear = null;
  let monthlyBreakevenYear = null;
  for (let y = 1; y <= SEARCH_HORIZON; y++) {
    const { cumOld, cumNew, monthlyOld, monthlyNew } = calcCumul(y);
    if (!ownershipBreakevenYear && cumNew <= cumOld) ownershipBreakevenYear = y;
    if (!monthlyBreakevenYear && monthlyNew <= monthlyOld) monthlyBreakevenYear = y;
    if (ownershipBreakevenYear && monthlyBreakevenYear) break;
  }

  const monthlyBreakeven = monthlyBreakevenYear
    ? `${monthlyBreakevenYear} an${monthlyBreakevenYear > 1 ? "s" : ""}`
    : null;
  const ownershipBreakeven = ownershipBreakevenYear
    ? `${ownershipBreakevenYear} an${ownershipBreakevenYear > 1 ? "s" : ""}`
    : null;

  const maxYears = Math.min(
    SEARCH_HORIZON,
    Math.max(Math.ceil(loanMonths / 12) + 5, monthlyBreakevenYear ? monthlyBreakevenYear + 2 : 10, 10)
  );

  const cumulData = Array.from({ length: maxYears }, (_, i) => {
    const year = i + 1;
    const { monthlyOld: cashOld, monthlyNew: cashNew } = calcCumul(year);
    return {
      name: `${year} an${year > 1 ? "s" : ""}`,
      "Ancien véhicule": cashOld,
      "Nouveau véhicule": cashNew,
    };
  });

  const loanEndLabel = `${Math.ceil(loanMonths / 12)} an${Math.ceil(loanMonths / 12) > 1 ? "s" : ""}`;

  return (
    <div className="card result">
      <h2>Résultats</h2>

      {newCost.residenceOfferLabel && (
        <p className="results-note">
          Borne en résidence : calcul basé sur la meilleure offre actuelle, {newCost.residenceOfferLabel}.
        </p>
      )}

      <div className="result-horizon-grid">
        <div className="result-horizon-card">
          <span className="result-horizon-label">Horizon retenu</span>
          <strong>{horizonMonths} mois</strong>
          <span className="result-horizon-note">
            Durée du prêt, sinon 36 mois
          </span>
        </div>
        <div className="result-horizon-card">
          <span className="result-horizon-label">Ancien véhicule</span>
          <strong>{fmtMoney(oldOwnership.netCost)}</strong>
          <span className="result-horizon-note">
            Cash {fmtMoney(oldOwnership.horizonTotal)}
          </span>
          <span className="result-horizon-note">
            Décote {fmtMoney(oldOwnership.valueLoss)}
          </span>
        </div>
        <div className="result-horizon-card">
          <span className="result-horizon-label">Nouveau véhicule</span>
          <strong>{fmtMoney(newOwnership.netCost)}</strong>
          <span className="result-horizon-note">
            Cash {fmtMoney(newOwnership.horizonTotal)}
          </span>
          {newOwnership.cash.downPaymentTotal > 0 && (
            <span className="result-horizon-note">
              Apport {fmtMoney(newOwnership.cash.downPaymentTotal)}
            </span>
          )}
          <span className="result-horizon-note">
            Résiduel {fmtMoney(newOwnership.residualValue)}
          </span>
          {newOwnership.remainingLoanBalance > 0 && (
            <span className="result-horizon-note">
              Dette restante {fmtMoney(newOwnership.remainingLoanBalance)}
            </span>
          )}
        </div>
        <div className="result-horizon-card">
          <span className="result-horizon-label">Lecture mensuelle</span>
          <strong>{monthlyGapWithLoan > 0 ? "+" : ""}{fmt(monthlyGapWithLoan)} €/mois</strong>
          <span className="result-horizon-note">
            Avec prêt vs ancien véhicule
          </span>
          <span className="result-horizon-note">
            Après prêt {monthlyGapAfterLoan > 0 ? "+" : ""}{fmt(monthlyGapAfterLoan)} €/mois
          </span>
        </div>
      </div>

      <table className="result-table">
        <thead>
          <tr>
            <th></th>
            <th>Ancien véhicule</th>
            <th>Nouveau (avec prêt)</th>
            <th>Nouveau (après prêt)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Carburant / énergie</td>
            <td>{fmt(oldCost.fuel / 12)} €/mois</td>
            <td>{fmt(newCost.fuel / 12)} €/mois</td>
            <td>{fmt(newCost.fuel / 12)} €/mois</td>
          </tr>
          {(oldCost.chargingSubscription > 0 || newCost.chargingSubscription > 0) && (
            <tr>
              <td>Abonnement recharge</td>
              <td>{oldCost.chargingSubscription > 0 ? `${fmt(oldCost.chargingSubscription / 12)} €/mois` : "—"}</td>
              <td>{newCost.chargingSubscription > 0 ? `${fmt(newCost.chargingSubscription / 12)} €/mois` : "—"}</td>
              <td>{newCost.chargingSubscription > 0 ? `${fmt(newCost.chargingSubscription / 12)} €/mois` : "—"}</td>
            </tr>
          )}
          <tr>
            <td>Entretien</td>
            <td>{fmt(oldCost.maintenance / 12)} €/mois</td>
            <td>{fmt(newCost.maintenance / 12)} €/mois</td>
            <td>{fmt(newCost.maintenance / 12)} €/mois</td>
          </tr>
          {(oldCost.insurance > 0 || newCost.insurance > 0) && (
            <tr>
              <td>Assurance</td>
              <td>{oldCost.insurance > 0 ? `${fmt(oldCost.insurance / 12)} €/mois` : "—"}</td>
              <td>{newCost.insurance > 0 ? `${fmt(newCost.insurance / 12)} €/mois` : "—"}</td>
              <td>{newCost.insurance > 0 ? `${fmt(newCost.insurance / 12)} €/mois` : "—"}</td>
            </tr>
          )}
          <tr>
            <td>Mensualité prêt</td>
            <td>—</td>
            <td>{fmt(financing.monthlyLoan)} €/mois</td>
            <td>—</td>
          </tr>
          {charger > 0 && (
            <tr>
              <td>Borne de recharge (1er mois)</td>
              <td>—</td>
              <td>{fmt(charger)} € (unique)</td>
              <td>—</td>
            </tr>
          )}
          <tr className="total-row">
            <td>Total mensuel</td>
            <td>{fmt(totalOld)} €/mois</td>
            <td>{fmt(totalNewWithLoan)} €/mois {charger > 0 && <span style={{ fontSize: 11, color: "#f59e0b" }}>+{fmt(charger)} € M1</span>}</td>
            <td>{fmt(totalNewAfterLoan)} €/mois</td>
          </tr>
          <tr>
            <td>Différence vs ancien</td>
            <td>—</td>
            <td style={{ color: diff > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
              {diff > 0 ? "+" : ""}{fmt(diff)} €/mois
            </td>
            <td style={{ color: diffAfter > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
              {diffAfter > 0 ? "+" : ""}{fmt(diffAfter)} €/mois
            </td>
          </tr>
        </tbody>
      </table>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fontSize: 13 }} />
          <YAxis tickFormatter={(v) => `${v} €`} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Carburant" stackId="a" fill={COLORS.fuel} barSize={40} />
          <Bar dataKey="Prêt" stackId="a" fill={COLORS.loan} barSize={40} />
          {hasChargingSubscription && (
            <Bar dataKey="Abonnement" stackId="a" fill={COLORS.subscription} barSize={40} />
          )}
          <Bar dataKey="Entretien" stackId="a" fill={COLORS.maintenance} barSize={40} />
          {(oldCost.insurance > 0 || newCost.insurance > 0) && (
            <Bar dataKey="Assurance" stackId="a" fill={COLORS.insurance} barSize={40} />
          )}
        </BarChart>
      </ResponsiveContainer>

      <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 16 }}>
        <button className="collapsible-header" onClick={() => setShowCumul(!showCumul)}>
          <h3 className="collapsible-title">Rentabilité mensuelle cumulée</h3>
          {!showCumul && monthlyBreakeven && (
            <span className="collapsible-badge badge-green">
              Favorable dès {monthlyBreakeven}
            </span>
          )}
          {!showCumul && !monthlyBreakeven && loanMonths > 0 && (
            <span className="collapsible-badge badge-red">
              Non amorti sur {SEARCH_HORIZON} ans
            </span>
          )}
          <span className="collapsible-arrow">{showCumul ? "▲" : "▼"}</span>
        </button>

        {showCumul && (
          <>
            <p style={{ fontSize: 13, color: "#64748b", margin: "8px 0 16px" }}>
              Comparaison simple des coûts mensuels visibles : ancien véhicule d'un côté, nouveau véhicule avec mensualité de prêt pendant le financement puis nouveau véhicule seul après le prêt. Les coûts ponctuels, la reprise et la valeur résiduelle ne sont pas utilisés pour ce seuil.
              {ownershipBreakeven && ` En coût de possession avec valeur résiduelle, le nouveau véhicule devient favorable dès ${ownershipBreakeven}.`}
            </p>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {monthlyBreakeven ? (
                <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "3px 10px" }}>
                  Favorable dès {monthlyBreakeven}
                </span>
              ) : loanMonths > 0 ? (
                <span style={{ fontSize: 13, color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "3px 10px" }}>
                  Non amorti sur {SEARCH_HORIZON} ans
                </span>
              ) : null}
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} tick={{ fontSize: 12 }} />
                <Tooltip content={cumulTooltip} />
                <Legend />
                {loanMonths > 0 && (
                  <ReferenceLine
                    x={loanEndLabel}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: "Fin du prêt", fontSize: 11, fill: "#f59e0b", position: "insideTopRight" }}
                  />
                )}
                {monthlyBreakeven && (
                  <ReferenceLine
                    x={monthlyBreakeven}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: "Seuil", fontSize: 11, fill: "#10b981", position: "insideTopLeft" }}
                  />
                )}
                <Line type="monotone" dataKey="Nouveau véhicule" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Ancien véhicule" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
