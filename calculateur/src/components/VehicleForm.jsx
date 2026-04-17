import { useT } from "../i18n";

function Field({ label, value, onChange }) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <input type="number" value={value} onChange={onChange} />
    </div>
  );
}

export default function VehicleForm({ type, data, setData, title }) {
  const t = useT();
  const isUsed = data.used ?? false;

  return (
    <div className="card">
      <h2>{title}</h2>

      <div className="toggle-group" style={{ marginBottom: 10 }}>
        <button type="button" className={!isUsed ? "toggle active" : "toggle"}
          onClick={() => setData({ ...data, used: false })}>{t.newCar}</button>
        <button type="button" className={isUsed ? "toggle active" : "toggle"}
          onClick={() => setData({ ...data, used: true })}>{t.usedCar}</button>
      </div>

      <Field
        label={t.purchasePrice}
        value={data.purchasePrice ?? ""}
        onChange={(e) => setData({ ...data, purchasePrice: parseFloat(e.target.value) || 0 })}
      />
      {isUsed && (
        <Field
          label={t.purchaseYear}
          value={data.purchaseYear ?? ""}
          onChange={(e) => setData({ ...data, purchaseYear: parseInt(e.target.value) || 0 })}
        />
      )}
      <Field
        label={t.registrationYear}
        value={data.year ?? ""}
        onChange={(e) => setData({ ...data, year: parseInt(e.target.value) || 0 })}
      />
      <Field
        label={t.currentKm}
        value={data.currentKm ?? ""}
        onChange={(e) => setData({ ...data, currentKm: parseInt(e.target.value) || 0 })}
      />

      <div className="field-divider" />

      {type === "thermal" && (
        <>
          <Field label={t.cityConsumptionL} value={data.cityConsumption ?? ""}
            onChange={(e) => setData({ ...data, cityConsumption: parseFloat(e.target.value) || 0 })} />
          <Field label={t.highwayConsumptionL} value={data.highwayConsumption ?? ""}
            onChange={(e) => setData({ ...data, highwayConsumption: parseFloat(e.target.value) || 0 })} />
          <Field label={t.fuelPrice} value={data.energyPrice ?? ""}
            onChange={(e) => setData({ ...data, energyPrice: parseFloat(e.target.value) || 0 })} />
        </>
      )}

      {type === "electric" && (
        <>
          <Field label={t.cityConsumptionKwh} value={data.cityConsumption ?? ""}
            onChange={(e) => setData({ ...data, cityConsumption: parseFloat(e.target.value) || 0 })} />
          <Field label={t.highwayConsumptionKwh} value={data.highwayConsumption ?? ""}
            onChange={(e) => setData({ ...data, highwayConsumption: parseFloat(e.target.value) || 0 })} />
          <Field label={t.electricityPrice} value={data.energyPrice ?? ""}
            onChange={(e) => setData({ ...data, energyPrice: parseFloat(e.target.value) || 0 })} />
        </>
      )}
    </div>
  );
}
