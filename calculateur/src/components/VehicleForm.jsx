import { useState } from "react";
import { useT } from "../i18n";

function Field({ label, value, onChange, integer }) {
  const initial = value !== undefined && value !== "" && value !== 0 ? String(value) : "";
  const [raw, setRaw] = useState(initial);
  const [error, setError] = useState(false);

  function handleChange(e) {
    const input = e.target.value;
    const normalized = input.replace(/,/g, ".");
    setRaw(input);
    if (input === "") { setError(false); onChange(0); return; }
    const num = integer ? parseInt(normalized) : parseFloat(normalized);
    if (isNaN(num)) { setError(true); }
    else { setError(false); onChange(num); }
  }

  return (
    <div className="field-row">
      <label>{label}</label>
      <div className="field-input-wrap">
        <input type="text" value={raw} onChange={handleChange} className={error ? "field-input-error" : ""} />
        {error && <span className="field-error-msg">Valeur invalide</span>}
      </div>
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

      <Field label={t.purchasePrice} value={data.purchasePrice}
        onChange={(num) => setData({ ...data, purchasePrice: num })} />
      {isUsed && (
        <Field label={t.purchaseYear} value={data.purchaseYear} integer
          onChange={(num) => setData({ ...data, purchaseYear: num })} />
      )}
      <Field label={t.registrationYear} value={data.year} integer
        onChange={(num) => setData({ ...data, year: num })} />
      <Field label={t.currentKm} value={data.currentKm} integer
        onChange={(num) => setData({ ...data, currentKm: num })} />

      <div className="field-divider" />

      {type === "thermal" && (
        <>
          <Field label={t.cityConsumptionL} value={data.cityConsumption}
            onChange={(num) => setData({ ...data, cityConsumption: num })} />
          <Field label={t.highwayConsumptionL} value={data.highwayConsumption}
            onChange={(num) => setData({ ...data, highwayConsumption: num })} />
          <Field label={t.fuelPrice} value={data.energyPrice}
            onChange={(num) => setData({ ...data, energyPrice: num })} />
        </>
      )}

      {type === "electric" && (
        <>
          <Field label={t.cityConsumptionKwh} value={data.cityConsumption}
            onChange={(num) => setData({ ...data, cityConsumption: num })} />
          <Field label={t.highwayConsumptionKwh} value={data.highwayConsumption}
            onChange={(num) => setData({ ...data, highwayConsumption: num })} />
          <Field label={t.electricityPrice} value={data.energyPrice}
            onChange={(num) => setData({ ...data, energyPrice: num })} />
        </>
      )}
    </div>
  );
}
