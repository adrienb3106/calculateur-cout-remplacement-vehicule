import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getDepreciationCurve } from "../utils/calculations";
import { useT } from "../i18n";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => p.value != null && (
        <p key={p.name} style={{ color: p.stroke, margin: "2px 0" }}>
          {p.name} : {p.value.toLocaleString("fr-FR")} €
        </p>
      ))}
    </div>
  );
};

export default function DepreciationChart({ oldCar, newCar, kmCity, kmHighway, finance }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const annualKm = (kmCity || 0) + (kmHighway || 0);
  const currentYear = new Date().getFullYear();

  const oldCurve = getDepreciationCurve(oldCar, annualKm);
  const newCurve = getDepreciationCurve(
    { ...newCar, purchasePrice: newCar.purchasePrice || finance?.price },
    annualKm
  );

  if (!oldCurve.length && !newCurve.length) return null;

  const oldLabel = t.oldVehicle;
  const newLabel = t.newVehicle;

  const allYears = [...new Set([...oldCurve.map(p => p.year), ...newCurve.map(p => p.year)])].sort();
  const oldByYear = Object.fromEntries(oldCurve.map(p => [p.year, p]));
  const newByYear = Object.fromEntries(newCurve.map(p => [p.year, p]));

  const data = allYears.map(year => ({
    year,
    [oldLabel]: oldByYear[year]?.value ?? null,
    [newLabel]: newByYear[year]?.value ?? null,
  }));

  const oldPurchaseYear = oldCurve.find(p => p.isPurchase)?.year;
  const newPurchaseYear = newCurve.find(p => p.isPurchase)?.year;

  return (
    <div className="card">
      <button className="collapsible-header" onClick={() => setOpen(!open)}>
        <h2 style={{ margin: 0 }}>{t.depreciationTitle}</h2>
        <span className="collapsible-arrow">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          <p style={{ fontSize: 13, color: "#64748b", margin: "8px 0 16px" }}>
            {t.depreciationDesc}
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine x={currentYear} stroke="#94a3b8" strokeDasharray="4 4" />
              {oldPurchaseYear && oldPurchaseYear !== (oldCar.year || currentYear) && (
                <ReferenceLine x={oldPurchaseYear} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6}
                  label={{ value: t.purchase, fontSize: 11, fill: "#10b981", position: "top" }} />
              )}
              {newPurchaseYear && newPurchaseYear !== (newCar.year || currentYear) && (
                <ReferenceLine x={newPurchaseYear} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.6}
                  label={{ value: t.purchase, fontSize: 11, fill: "#3b82f6", position: "top" }} />
              )}
              <Line type="monotone" dataKey={oldLabel} stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey={newLabel} stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
