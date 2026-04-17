function Field({ label, value, onChange }) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <input
        type="number"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default function VehicleForm({ type, data, setData, title }) {
  const isUsed = data.used ?? false;

  return (
    <div className="card">
      <h2>{title}</h2>

      <div className="toggle-group" style={{ marginBottom: 10 }}>
        <button type="button" className={!isUsed ? "toggle active" : "toggle"}
          onClick={() => setData({ ...data, used: false })}>Neuf</button>
        <button type="button" className={isUsed ? "toggle active" : "toggle"}
          onClick={() => setData({ ...data, used: true })}>Occasion</button>
      </div>

      <Field
        label="Prix d'achat (€)"
        value={data.purchasePrice ?? ""}
        onChange={(e) => setData({ ...data, purchasePrice: parseFloat(e.target.value) || 0 })}
      />
      {isUsed && (
        <Field
          label="Année d'achat"
          value={data.purchaseYear ?? ""}
          onChange={(e) => setData({ ...data, purchaseYear: parseInt(e.target.value) || 0 })}
        />
      )}
      <Field
        label="Année de 1ère immatriculation"
        value={data.year ?? ""}
        onChange={(e) => setData({ ...data, year: parseInt(e.target.value) || 0 })}
      />
      <Field
        label="Kilométrage actuel (km)"
        value={data.currentKm ?? ""}
        onChange={(e) => setData({ ...data, currentKm: parseInt(e.target.value) || 0 })}
      />

      <div className="field-divider" />

      {type === "thermal" && (
        <>
          <Field
            label="Conso ville (L/100km)"
            value={data.cityConsumption ?? ""}
            onChange={(e) => setData({ ...data, cityConsumption: parseFloat(e.target.value) || 0 })}
          />
          <Field
            label="Conso autoroute (L/100km)"
            value={data.highwayConsumption ?? ""}
            onChange={(e) => setData({ ...data, highwayConsumption: parseFloat(e.target.value) || 0 })}
          />
          <Field
            label="Prix carburant (€/L)"
            value={data.energyPrice ?? ""}
            onChange={(e) => setData({ ...data, energyPrice: parseFloat(e.target.value) || 0 })}
          />
        </>
      )}

      {type === "electric" && (
        <>
          <Field
            label="Conso ville (kWh/100km)"
            value={data.cityConsumption ?? ""}
            onChange={(e) => setData({ ...data, cityConsumption: parseFloat(e.target.value) || 0 })}
          />
          <Field
            label="Conso autoroute (kWh/100km)"
            value={data.highwayConsumption ?? ""}
            onChange={(e) => setData({ ...data, highwayConsumption: parseFloat(e.target.value) || 0 })}
          />
          <Field
            label="Prix électricité (€/kWh)"
            value={data.energyPrice ?? ""}
            onChange={(e) => setData({ ...data, energyPrice: parseFloat(e.target.value) || 0 })}
          />
        </>
      )}
    </div>
  );
}