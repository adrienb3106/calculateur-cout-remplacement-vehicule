import { useState, useEffect } from "react";

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
import VehicleForm from "./components/VehicleForm";
import FinancingForm from "./components/FinancingForm";
import Results from "./components/Results";
import DepreciationChart from "./components/DepreciationChart";
import { useT } from "./i18n";
import "./style.css";

export default function App() {
  const t = useT();
  const [oldCar, setOldCar] = useState(() => load("oldCar", {}));
  const [newCar, setNewCar] = useState(() => load("newCar", {}));
  const [oldType, setOldType] = useState(() => load("oldType", "thermal"));
  const [newType, setNewType] = useState(() => load("newType", "electric"));
  const [finance, setFinance] = useState(() => load("finance", {}));
  const [kmCity, setKmCity] = useState(() => load("kmCity", 5000));
  const [kmHighway, setKmHighway] = useState(() => load("kmHighway", 5000));

  useEffect(() => { save("oldCar", oldCar); }, [oldCar]);
  useEffect(() => { save("newCar", newCar); }, [newCar]);
  useEffect(() => { save("oldType", oldType); }, [oldType]);
  useEffect(() => { save("newType", newType); }, [newType]);
  useEffect(() => { save("finance", finance); }, [finance]);
  useEffect(() => { save("kmCity", kmCity); }, [kmCity]);
  useEffect(() => { save("kmHighway", kmHighway); }, [kmHighway]);

  return (
    <div className="container">
      <div className="app-header">
        <h1>{t.appTitle}</h1>
      </div>

      <div className="card">
        <h2>{t.situation}</h2>

        <label>{t.iHave}</label>
        <div className="toggle-group">
          <button className={oldType === "thermal" ? "toggle active" : "toggle"} onClick={() => setOldType("thermal")}>{t.thermal}</button>
          <button className={oldType === "electric" ? "toggle active" : "toggle"} onClick={() => setOldType("electric")}>{t.electric}</button>
        </div>

        <label>{t.iWant}</label>
        <div className="toggle-group">
          <button className={newType === "thermal" ? "toggle active" : "toggle"} onClick={() => setNewType("thermal")}>{t.thermal}</button>
          <button className={newType === "electric" ? "toggle active" : "toggle"} onClick={() => setNewType("electric")}>{t.electric}</button>
        </div>

        <p className="section-label">{t.annualKm}</p>
        <div className="km-row">
          <div className="field-row">
            <label>{t.cityKm}</label>
            <input type="text" inputMode="numeric" min="0" step="500" value={kmCity}
              onChange={(e) => setKmCity(parseInt(e.target.value) || 0)} />
          </div>
          <div className="field-row">
            <label>{t.highwayKm}</label>
            <input type="text" inputMode="numeric" min="0" step="500" value={kmHighway}
              onChange={(e) => setKmHighway(parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      <div className="vehicles-grid">
        <VehicleForm title={t.currentVehicle} type={oldType} data={oldCar} setData={setOldCar} />
        <VehicleForm title={t.newVehicle} type={newType} data={newCar} setData={setNewCar} />
      </div>

      <FinancingForm data={finance} setData={setFinance} />

      <Results
        oldCar={{ ...oldCar, type: oldType }}
        newCar={{ ...newCar, type: newType }}
        finance={finance}
        kmCity={kmCity}
        kmHighway={kmHighway}
      />

      <DepreciationChart
        oldCar={{ ...oldCar, type: oldType }}
        newCar={{ ...newCar, type: newType }}
        kmCity={kmCity}
        kmHighway={kmHighway}
        finance={finance}
      />

      <footer className="app-footer">
        {t.copyright(new Date().getFullYear())}
      </footer>
    </div>
  );
}
