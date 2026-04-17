import { useState } from "react";
import { useT } from "../i18n";

function Field({ label, value, onChange }) {
  const initial = value !== undefined && value !== "" && value !== 0 ? String(value) : "";
  const [raw, setRaw] = useState(initial);
  const [error, setError] = useState(false);

  function handleChange(e) {
    const input = e.target.value;
    const normalized = input.replace(/,/g, ".");
    setRaw(input);
    if (input === "") { setError(false); onChange(0); return; }
    const num = parseFloat(normalized);
    if (isNaN(num)) { setError(true); }
    else { setError(false); onChange(num); }
  }

  return (
    <div className="field-col">
      <label className="field-col-label">{label}</label>
      <input type="text" value={raw} onChange={handleChange} className={error ? "field-input-error" : ""} />
      {error && <span className="field-error-msg">Valeur invalide</span>}
    </div>
  );
}

function PriceBreakdown({ data, t }) {
  const price = parseFloat(data.price) || 0;
  if (!price) return null;

  const steps = [];
  let current = price;

  steps.push({ label: t.catalogPrice, value: current });

  if (data.negotiation) {
    current -= parseFloat(data.negotiation) || 0;
    steps.push({ label: t.afterNegotiation, value: current, delta: -data.negotiation });
  }
  if (data.apport) {
    current -= parseFloat(data.apport) || 0;
    steps.push({ label: t.afterDownPayment, value: current, delta: -data.apport });
  }
  if (data.aids) {
    current -= parseFloat(data.aids) || 0;
    steps.push({ label: t.afterSubsidies, value: current, delta: -data.aids });
  }
  if (data.withTradeIn && data.tradeIn) {
    current -= parseFloat(data.tradeIn) || 0;
    steps.push({ label: t.afterTradeIn, value: current, delta: -data.tradeIn });
  }

  if (steps.length <= 1) return null;

  return (
    <div className="price-breakdown">
      {steps.map((s, i) => (
        <div key={i} className={`price-step ${i === steps.length - 1 ? "price-step-final" : ""}`}>
          <span className="price-step-label">{s.label}</span>
          <span className="price-step-values">
            {s.delta != null && (
              <span className="price-step-delta">
                − {Math.abs(parseFloat(s.delta)).toLocaleString("fr-FR")} €
              </span>
            )}
            <span className="price-step-value">
              {s.value.toLocaleString("fr-FR")} €
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function FinancingForm({ data, setData }) {
  const t = useT();

  return (
    <div className="card">
      <h2>{t.financing}</h2>

      <p className="section-label">{t.priceReductions}</p>
      <div className="finance-grid">
        <Field label={t.vehiclePrice} value={data.price ?? ""}
          onChange={(e) => setData({ ...data, price: parseFloat(e.target.value) || 0 })} />
        <Field label={t.negotiation} value={data.negotiation ?? ""}
          onChange={(e) => setData({ ...data, negotiation: parseFloat(e.target.value) || 0 })} />
        <Field label={t.downPayment} value={data.apport ?? ""}
          onChange={(e) => setData({ ...data, apport: parseFloat(e.target.value) || 0 })} />
        <Field label={t.subsidies} value={data.aids ?? ""}
          onChange={(e) => setData({ ...data, aids: parseFloat(e.target.value) || 0 })} />
      </div>

      <div className="field-divider" />

      <div className="finance-reprise">
        <label className="field-col-label">{t.tradeIn}</label>
        <input type="checkbox" checked={data.withTradeIn || false}
          onChange={(e) => setData({ ...data, withTradeIn: e.target.checked })} />
        {data.withTradeIn && (
          <div style={{ flex: 1 }}>
            <Field label={t.tradeInValue} value={data.tradeIn ?? ""}
              onChange={(e) => setData({ ...data, tradeIn: parseFloat(e.target.value) || 0 })} />
          </div>
        )}
      </div>

      <PriceBreakdown data={data} t={t} />

      <div className="field-divider" />

      <p className="section-label">{t.loan}</p>
      <div className="finance-grid">
        <Field label={t.loanDuration} value={data.duration ?? ""}
          onChange={(e) => setData({ ...data, duration: parseFloat(e.target.value) || 0 })} />
        <Field label={t.interestRate} value={data.rate ?? ""}
          onChange={(e) => setData({ ...data, rate: parseFloat(e.target.value) || 0 })} />
      </div>

      <div className="field-divider" />

      <div className="finance-reprise">
        <label className="field-col-label">{t.charger}</label>
        <input type="checkbox" checked={data.withCharger || false}
          onChange={(e) => setData({ ...data, withCharger: e.target.checked })} />
        {data.withCharger && (
          <div style={{ flex: 1 }}>
            <Field label={t.chargerCost} value={data.chargerCost ?? ""}
              onChange={(e) => setData({ ...data, chargerCost: parseFloat(e.target.value) || 0 })} />
          </div>
        )}
      </div>
    </div>
  );
}
