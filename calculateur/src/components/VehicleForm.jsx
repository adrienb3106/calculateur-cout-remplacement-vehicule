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
  return (
    <div className="card">
      <h2>{title}</h2>

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