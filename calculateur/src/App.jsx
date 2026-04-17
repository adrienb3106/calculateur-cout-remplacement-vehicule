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
import "./style.css";

export default function App() {
  const [oldCar, setOldCar] = useState(() => load("oldCar", {}));
  const [newCar, setNewCar] = useState(() => load("newCar", {}));
  const [oldType, setOldType] = useState(() => load("oldType", "thermal"));
  const [newType, setNewType] = useState(() => load("newType", "electric"));
  const [finance, setFinance] = useState(() => load("finance", {}));
  const [kmCity, setKmCity] = useState(() => load("kmCity", 5000));
  const [kmHighway, setKmHighway] = useState(() => load("kmHighway", 5000));
  const [showResults, setShowResults] = useState(() => load("showResults", false));

  useEffect(() => { save("oldCar", oldCar); }, [oldCar]);
  useEffect(() => { save("newCar", newCar); }, [newCar]);
  useEffect(() => { save("oldType", oldType); }, [oldType]);
  useEffect(() => { save("newType", newType); }, [newType]);
  useEffect(() => { save("finance", finance); }, [finance]);
  useEffect(() => { save("kmCity", kmCity); }, [kmCity]);
  useEffect(() => { save("kmHighway", kmHighway); }, [kmHighway]);
  useEffect(() => { save("showResults", showResults); }, [showResults]);

  return (
    <div className="container">
      <h1>Comparateur de coût véhicule</h1>

      <div className="card">
        <h2>Situation</h2>

        <label>J'ai un véhicule :</label>
        <div className="toggle-group">
          <button
            className={oldType === "thermal" ? "toggle active" : "toggle"}
            onClick={() => setOldType("thermal")}
          >
            Thermique
          </button>
          <button
            className={oldType === "electric" ? "toggle active" : "toggle"}
            onClick={() => setOldType("electric")}
          >
            Électrique
          </button>
        </div>

        <label>Je veux acheter :</label>
        <div className="toggle-group">
          <button
            className={newType === "thermal" ? "toggle active" : "toggle"}
            onClick={() => setNewType("thermal")}
          >
            Thermique
          </button>
          <button
            className={newType === "electric" ? "toggle active" : "toggle"}
            onClick={() => setNewType("electric")}
          >
            Électrique
          </button>
        </div>

        <h3>Kilométrage annuel</h3>

        <label>Ville (km)</label>
        <input
          type="number"
          min="0"
          step="500"
          value={kmCity}
          onChange={(e) => setKmCity(parseInt(e.target.value) || 0)}
        />

        <label>Autoroute (km)</label>
        <input
          type="number"
          min="0"
          step="500"
          value={kmHighway}
          onChange={(e) => setKmHighway(parseInt(e.target.value) || 0)}
        />

      </div>

      

      <VehicleForm
        title="Véhicule actuel"
        type={oldType}
        data={oldCar}
        setData={setOldCar}
      />

      <VehicleForm
        title="Nouveau véhicule"
        type={newType}
        data={newCar}
        setData={setNewCar}
      />

      <FinancingForm data={finance} setData={setFinance} />

      <button className="btn-calculate" onClick={() => setShowResults(true)}>
        Calculer
      </button>

      {showResults && (
        <Results
          oldCar={{ ...oldCar, type: oldType }}
          newCar={{ ...newCar, type: newType }}
          finance={finance}
          kmCity={kmCity}
          kmHighway={kmHighway}
        />
      )}
    </div>
  );
}