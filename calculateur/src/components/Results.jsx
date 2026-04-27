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
} from "../utils/calculations";

const fmt = (v) => (Number.isFinite(v) ? v.toFixed(2) : "—");

const COLORS = {
  fuel: "#3b82f6",
  maintenance: "#10b981",
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
  const charger = financing.chargerCost || 0;

  const chartData = [
    {
      name: "Ancien véhicule",
      Carburant: oldCost.fuel / 12,
      Entretien: oldCost.maintenance / 12,
      Prêt: 0,
    },
    {
      name: "Nouveau (avec prêt)",
      Carburant: newCost.fuel / 12,
      Entretien: newCost.maintenance / 12,
      Prêt: financing.monthlyLoan,
    },
    {
      name: "Nouveau (après prêt)",
      Carburant: newCost.fuel / 12,
      Entretien: newCost.maintenance / 12,
      Prêt: 0,
    },
  ];

  const loanMonths = finance.duration || 0;
  const maxYears = Math.max(Math.ceil(loanMonths / 12) + 5, 10);

  const cumulData = Array.from({ length: maxYears }, (_, i) => {
    const year = i + 1;
    const months = year * 12;
    const activeLoanMonths = Math.min(months, loanMonths);
    const cumOld = Math.round(months * oldCost.monthly);
    const cumNew = Math.round(
      activeLoanMonths * (newCost.monthly + financing.monthlyLoan) +
      Math.max(0, months - loanMonths) * newCost.monthly +
      charger
    );
    return {
      name: `${year} an${year > 1 ? "s" : ""}`,
      "Ancien véhicule": cumOld,
      "Nouveau véhicule": cumNew,
    };
  });

  const cumulBreakeven = cumulData.find(d => d["Nouveau véhicule"] <= d["Ancien véhicule"]);
  const loanEndLabel = `${Math.ceil(loanMonths / 12)} an${Math.ceil(loanMonths / 12) > 1 ? "s" : ""}`;

  return (
    <div className="card result">
      <h2>Résultats</h2>

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
          <tr>
            <td>Entretien</td>
            <td>{fmt(oldCost.maintenance / 12)} €/mois</td>
            <td>{fmt(newCost.maintenance / 12)} €/mois</td>
            <td>{fmt(newCost.maintenance / 12)} €/mois</td>
          </tr>
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
            <td>{fmt(totalNewWithLoan)} €/mois {charger > 0 && <span style={{fontSize:11, color:"#f59e0b"}}>+{fmt(charger)} € M1</span>}</td>
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
          <Bar dataKey="Entretien" stackId="a" fill={COLORS.maintenance} barSize={40} />
          <Bar dataKey="Prêt" stackId="a" fill={COLORS.loan} barSize={40} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 16 }}>
        <button className="collapsible-header" onClick={() => setShowCumul(!showCumul)}>
          <h3 className="collapsible-title">Coût total cumulé</h3>
          {!showCumul && cumulBreakeven && (
            <span className="collapsible-badge badge-green">
              Rentable dès {cumulBreakeven.name}
            </span>
          )}
          {!showCumul && !cumulBreakeven && loanMonths > 0 && (
            <span className="collapsible-badge badge-red">
              Non rentable sur la période
            </span>
          )}
          <span className="collapsible-arrow">{showCumul ? "▲" : "▼"}</span>
        </button>

        {showCumul && (
          <>
            <p style={{ fontSize: 13, color: "#64748b", margin: "8px 0 16px" }}>
              Argent total dépensé depuis l'achat — comparer garder l'ancien véhicule vs acquérir le nouveau.
            </p>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {cumulBreakeven ? (
                <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "3px 10px" }}>
                  Rentable dès {cumulBreakeven.name}
                </span>
              ) : loanMonths > 0 ? (
                <span style={{ fontSize: 13, color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "3px 10px" }}>
                  Non rentable sur la période
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
                {cumulBreakeven && (
                  <ReferenceLine
                    x={cumulBreakeven.name}
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
