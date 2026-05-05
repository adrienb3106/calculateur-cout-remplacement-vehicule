import { useState } from "react";
import { useT } from "../i18n";
import chargingOffers from "../../tarifs.json";

const DEFAULT_INDIVIDUAL_OFFER =
  chargingOffers.find((offer) => offer.id === "izi_by_edf") || chargingOffers[0] || null;

function Field({ label, value, onChange, integer, hint }) {
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
        {hint && !error && <span className="field-hint-msg">{hint}</span>}
      </div>
    </div>
  );
}

export default function VehicleForm({ type, data, setData, title, role = "current", kmCity = 0, kmHighway = 0 }) {
  const t = useT();
  const isUsed = data.used ?? false;
  const totalKm = (Number(kmCity) || 0) + (Number(kmHighway) || 0);
  const suggestedOffPeakShare = totalKm ? Math.round(((Number(kmCity) || 0) / totalKm) * 100) : 0;
  const chargingSetup = data.chargingSetup || "individual";
  const showAdvancedElectricOptions = role === "new";

  function handleChargingSetupChange(nextSetup) {
    const nextData = { ...data, chargingSetup: nextSetup };

    if (nextSetup === "individual") {
      if (!data.hcPrice && DEFAULT_INDIVIDUAL_OFFER?.hc_price_eur_per_kwh) {
        nextData.hcPrice = DEFAULT_INDIVIDUAL_OFFER.hc_price_eur_per_kwh;
      }
      if (!data.hpPrice && DEFAULT_INDIVIDUAL_OFFER?.hp_price_eur_per_kwh) {
        nextData.hpPrice = DEFAULT_INDIVIDUAL_OFFER.hp_price_eur_per_kwh;
      }
      if (data.homeOffPeakShare === undefined && totalKm) {
        nextData.homeOffPeakShare = suggestedOffPeakShare;
      }
    }

    setData(nextData);
  }

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

          {showAdvancedElectricOptions ? (
            <>
              <p className="section-label">Recharge</p>
              <div className="toggle-group" style={{ marginBottom: 10 }}>
                <button
                  type="button"
                  className={chargingSetup === "individual" ? "toggle active" : "toggle"}
                  onClick={() => handleChargingSetupChange("individual")}
                >
                  Borne individuelle
                </button>
                <button
                  type="button"
                  className={chargingSetup === "residence" ? "toggle active" : "toggle"}
                  onClick={() => handleChargingSetupChange("residence")}
                >
                  Borne en résidence
                </button>
              </div>

              {chargingSetup === "individual" && (
                <>
                  <Field
                    label="Prix HC (€/kWh)"
                    value={data.hcPrice}
                    onChange={(num) => setData({ ...data, hcPrice: num })}
                  />
                  <Field
                    label="Prix HP (€/kWh)"
                    value={data.hpPrice}
                    onChange={(num) => setData({ ...data, hpPrice: num })}
                  />
                  <Field
                    label="Recharge maison en HC (%)"
                    value={data.homeOffPeakShare ?? suggestedOffPeakShare}
                    integer
                    onChange={(num) => setData({ ...data, homeOffPeakShare: num })}
                  />
                </>
              )}
              {chargingSetup === "residence" && (
                <p className="field-note">
                  Le calcul utilise la meilleure offre de recharge en résidence issue de la page 2.
                </p>
              )}
            </>
          ) : (
            <Field label={t.electricityPrice} value={data.energyPrice}
              onChange={(num) => setData({ ...data, energyPrice: num })} />
          )}
        </>
      )}
    </div>
  );
}
