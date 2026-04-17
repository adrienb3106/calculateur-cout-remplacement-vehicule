function Field({ label, value, onChange }) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <input type="number" value={value} onChange={onChange} />
    </div>
  );
}

export default function FinancingForm({ data, setData }) {
  return (
    <div className="card">
      <h2>Financement</h2>

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

      <div className="field-row">
        <label>Reprise ?</label>
        <input
          type="checkbox"
          checked={data.withTradeIn || false}
          onChange={(e) => setData({ ...data, withTradeIn: e.target.checked })}
        />
      </div>

      {data.withTradeIn && (
        <Field
          label="Valeur reprise (€)"
          value={data.tradeIn ?? ""}
          onChange={(e) => setData({ ...data, tradeIn: parseFloat(e.target.value) || 0 })}
        />
      )}

      <Field
        label="Durée du prêt (ans)"
        value={data.duration ?? ""}
        onChange={(e) => setData({ ...data, duration: parseFloat(e.target.value) || 0 })}
      />
      <Field
        label="Taux d'intérêt (%)"
        value={data.rate ?? ""}
        onChange={(e) => setData({ ...data, rate: parseFloat(e.target.value) || 0 })}
      />
    </div>
  );
}