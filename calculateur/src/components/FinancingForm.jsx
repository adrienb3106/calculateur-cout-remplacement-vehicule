function Field({ label, value, onChange }) {
  return (
    <div className="field-col">
      <label className="field-col-label">{label}</label>
      <input type="number" value={value} onChange={onChange} />
    </div>
  );
}

function PriceBreakdown({ data }) {
  const price = parseFloat(data.price) || 0;
  if (!price) return null;

  const steps = [];
  let current = price;

  steps.push({ label: "Prix catalogue", value: current });

  if (data.negotiation) {
    current -= parseFloat(data.negotiation) || 0;
    steps.push({ label: "Après négociation", value: current, delta: -data.negotiation });
  }
  if (data.apport) {
    current -= parseFloat(data.apport) || 0;
    steps.push({ label: "Après apport", value: current, delta: -data.apport });
  }
  if (data.aids) {
    current -= parseFloat(data.aids) || 0;
    steps.push({ label: "Après aides", value: current, delta: -data.aids });
  }
  if (data.withTradeIn && data.tradeIn) {
    current -= parseFloat(data.tradeIn) || 0;
    steps.push({ label: "Après reprise", value: current, delta: -data.tradeIn });
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
  return (
    <div className="card">
      <h2>Financement</h2>

      <p className="section-label">Prix &amp; réductions</p>
      <div className="finance-grid">
        <Field
          label="Prix véhicule (€)"
          value={data.price ?? ""}
          onChange={(e) => setData({ ...data, price: parseFloat(e.target.value) || 0 })}
        />
        <Field
          label="Négociation (€)"
          value={data.negotiation ?? ""}
          onChange={(e) => setData({ ...data, negotiation: parseFloat(e.target.value) || 0 })}
        />
        <Field
          label="Apport (€)"
          value={data.apport ?? ""}
          onChange={(e) => setData({ ...data, apport: parseFloat(e.target.value) || 0 })}
        />
        <Field
          label="Aides (€)"
          value={data.aids ?? ""}
          onChange={(e) => setData({ ...data, aids: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="field-divider" />

      <div className="finance-reprise">
        <label className="field-col-label">Reprise ?</label>
        <input
          type="checkbox"
          checked={data.withTradeIn || false}
          onChange={(e) => setData({ ...data, withTradeIn: e.target.checked })}
        />
        {data.withTradeIn && (
          <div style={{ flex: 1 }}>
            <Field
              label="Valeur reprise (€)"
              value={data.tradeIn ?? ""}
              onChange={(e) => setData({ ...data, tradeIn: parseFloat(e.target.value) || 0 })}
            />
          </div>
        )}
      </div>

      <PriceBreakdown data={data} />

      <div className="field-divider" />

      <p className="section-label">Prêt</p>
      <div className="finance-grid">
        <Field
          label="Durée (ans)"
          value={data.duration ?? ""}
          onChange={(e) => setData({ ...data, duration: parseFloat(e.target.value) || 0 })}
        />
        <Field
          label="Taux d'intérêt (%)"
          value={data.rate ?? ""}
          onChange={(e) => setData({ ...data, rate: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="field-divider" />

      <div className="finance-reprise">
        <label className="field-col-label">Borne de recharge ?</label>
        <input
          type="checkbox"
          checked={data.withCharger || false}
          onChange={(e) => setData({ ...data, withCharger: e.target.checked })}
        />
        {data.withCharger && (
          <div style={{ flex: 1 }}>
            <Field
              label="Coût installation (€)"
              value={data.chargerCost ?? ""}
              onChange={(e) => setData({ ...data, chargerCost: parseFloat(e.target.value) || 0 })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
