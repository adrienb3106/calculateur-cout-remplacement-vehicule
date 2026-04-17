import { useState } from "react";
import { useT } from "../i18n";
import { getMaxPrice } from "../utils/calculations";

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
    current -= data.negotiation;
    steps.push({ label: t.afterNegotiation, value: current, delta: -data.negotiation });
  }
  if (data.apport) {
    current -= data.apport;
    steps.push({ label: t.afterDownPayment, value: current, delta: -data.apport });
  }
  if (data.aids) {
    current -= data.aids;
    steps.push({ label: t.afterSubsidies, value: current, delta: -data.aids });
  }
  if (data.withTradeIn && data.tradeIn) {
    current -= data.tradeIn;
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
                − {Math.abs(s.delta).toLocaleString("fr-FR")} €
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
  const [showBudget, setShowBudget] = useState(false);
  const [targetMonthly, setTargetMonthly] = useState(0);
  const [targetRaw, setTargetRaw] = useState("");
  const [targetError, setTargetError] = useState(false);

  const maxPrice = showBudget && targetMonthly
    ? getMaxPrice(targetMonthly, data.rate || 0, data.duration || 0, data)
    : null;

  return (
    <div className="card">
      <h2>{t.financing}</h2>

      <p className="section-label">{t.priceReductions}</p>
      <div className="finance-grid">
        <Field label={t.vehiclePrice} value={data.price}
          onChange={(num) => setData({ ...data, price: num })} />
        <Field label={t.negotiation} value={data.negotiation}
          onChange={(num) => setData({ ...data, negotiation: num })} />
        <Field label={t.downPayment} value={data.apport}
          onChange={(num) => setData({ ...data, apport: num })} />
        <Field label={t.subsidies} value={data.aids}
          onChange={(num) => setData({ ...data, aids: num })} />
      </div>

      <div className="field-divider" />

      <div className="finance-reprise">
        <label className="field-col-label">{t.tradeIn}</label>
        <input type="checkbox" checked={data.withTradeIn || false}
          onChange={(e) => setData({ ...data, withTradeIn: e.target.checked })} />
        {data.withTradeIn && (
          <div style={{ flex: 1 }}>
            <Field label={t.tradeInValue} value={data.tradeIn}
              onChange={(num) => setData({ ...data, tradeIn: num })} />
          </div>
        )}
      </div>

      <PriceBreakdown data={data} t={t} />

      <div className="field-divider" />

      <p className="section-label">{t.loan}</p>
      <div className="finance-grid">
        <Field label={t.loanDuration} value={data.duration}
          onChange={(num) => setData({ ...data, duration: num })} />
        <Field label={t.interestRate} value={data.rate}
          onChange={(num) => setData({ ...data, rate: num })} />
      </div>

      <div className="field-divider" />

      <div className="finance-reprise">
        <label className="field-col-label">{t.charger}</label>
        <input type="checkbox" checked={data.withCharger || false}
          onChange={(e) => setData({ ...data, withCharger: e.target.checked })} />
        {data.withCharger && (
          <div style={{ flex: 1 }}>
            <Field label={t.chargerCost} value={data.chargerCost}
              onChange={(num) => setData({ ...data, chargerCost: num })} />
          </div>
        )}
      </div>

      <div className="field-divider" />

      <div className="finance-reprise">
        <label className="field-col-label">{t.budgetMax}</label>
        <input type="checkbox" checked={showBudget}
          onChange={(e) => setShowBudget(e.target.checked)} />
      </div>

      {showBudget && (
        <div style={{ marginTop: 10 }}>
          <div className="field-col" style={{ maxWidth: 220 }}>
            <label className="field-col-label">{t.targetMonthly}</label>
            <input
              type="text"
              value={targetRaw}
              onChange={(e) => {
                const input = e.target.value;
                const normalized = input.replace(/,/g, ".");
                setTargetRaw(input);
                const num = parseFloat(normalized);
                if (isNaN(num)) { setTargetError(true); setTargetMonthly(0); }
                else { setTargetError(false); setTargetMonthly(num); }
              }}
              className={targetError ? "field-input-error" : ""}
            />
            {targetError && <span className="field-error-msg">Valeur invalide</span>}
          </div>
          {maxPrice !== null && (
            <div className="budget-max-result">
              <span className="budget-max-price">{t.maxPriceResult(maxPrice)}</span>
              <span className="budget-max-hint">{t.maxPriceHint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
