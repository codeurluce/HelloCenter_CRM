// components/componentsdesonglets/AgentInfoPanel.jsx
import React, { useEffect, useRef } from "react";
import { startSession, closeSession } from "../../api/saveSessionToDB";
import StatusSelector, {
  statuses,
  formatTime,
} from "../../shared/StatusSelector.jsx";

export default function AgentInfoPanel({
  userId,
  etat,
  setEtat,
  timers,
  setTimers,
  lastChange,
  setLastChange,
  elapsed,
  setElapsed,
}) {
  const intervalRef = useRef();

  // Timer qui incrémente elapsed en live depuis lastChange
  useEffect(() => {
    if (!etat || !lastChange || isNaN(new Date(lastChange).getTime())) {
      setElapsed(0);
      clearInterval(intervalRef.current);
      return;
    }

    const update = () => {
      const diff = Math.floor(
        (Date.now() - new Date(lastChange).getTime()) / 1000
      );
      setElapsed(diff >= 0 ? diff : 0);
    };

    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [etat, lastChange, setElapsed]);

  // Sauvegarde locale des timers
  useEffect(() => {
    try {
      localStorage.setItem(
        "timers",
        JSON.stringify({
          etat,
          timers,
          lastChange:
            lastChange instanceof Date ? lastChange.toISOString() : null,
        })
      );
    } catch {
      // ignore localStorage errors
    }
  }, [etat, timers, lastChange]);

  // Fonction pour extraire pauseType à partir de la clé
  const getPauseType = (etatFr) => {
    const statusObj = statuses.find((s) => s.statusFr === etatFr);
    if (!statusObj) return null;
    return statusObj.key.startsWith("pause_")
      ? statusObj.key.split("_")[1]
      : null;
  };

  // Gestion du clic / sélection d'un nouvel état
  const handleSelect = async (newEtatFr, pause) => {
    if (!userId) {
      console.error("User ID manquant, impossible d'enregistrer la session");
      return;
    }

    const oldStatusObj = statuses.find((s) => s.statusFr === etat);
    const oldKey = oldStatusObj?.key;

    if (etat && lastChange && !isNaN(new Date(lastChange).getTime()) && oldKey) {
      const duree = Math.floor(
        (Date.now() - new Date(lastChange).getTime()) / 1000
      );

      if (duree > 0) {
        const newTimers = { ...timers };
        if (newTimers[oldKey] !== undefined) {
          newTimers[oldKey] += duree;
        } else {
          newTimers[oldKey] = duree;
        }
        setTimers(newTimers);
      }
    }

    try {
      await closeSession(userId);
    } catch (error) {
      if (!error.message.includes("Aucune session active trouvée")) {
        console.error("Erreur fermeture session:", error);
        return;
      }
    }

    const newStatusObj = statuses.find((s) => s.statusFr === newEtatFr);
    const newKey = newStatusObj?.key;

    try {
      await startSession({
        userId,
        status: newEtatFr,
        pauseType: pause || getPauseType(newEtatFr),
      });

      setEtat(newEtatFr);
      setLastChange(new Date());
      setElapsed(0);
    } catch (error) {
      console.error("Erreur démarrage session:", error);
    }
  };

  // Mappage timers avec clés technique (key) pour cohérence
  const timersByKey = timers;
  const currentKey = statuses.find((s) => s.statusFr === etat)?.key || null;

  // Clés utilisées dans les calculs de totaux
  const pausesForTotal = ["pause_cafe_1", "pause_dejeuner", "pause_cafe_2"];
  const indisposForTotal = ["reunion", "pause_formation", "brief"];

  // Calculs totaux par clé
  const totalPause = pausesForTotal.reduce(
    (sum, key) =>
      sum + (timersByKey[key] || 0) + (currentKey === key ? elapsed : 0),
    0
  );
  const totalIndispo = indisposForTotal.reduce(
    (sum, key) =>
      sum + (timersByKey[key] || 0) + (currentKey === key ? elapsed : 0),
    0
  );
  const dispoStatus = statuses.find((s) => s.key === "disponible");
  const totalDispo =
    (timersByKey[dispoStatus?.key] || 0) +
    (currentKey === dispoStatus?.key ? elapsed : 0);

  const totalPresence = totalDispo + totalPause + totalIndispo;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "90vh", // ✅ corrigé : minHeight au lieu de height
        padding: 24,
        background: "#f9fafb",
        borderRadius: 12,
        overflowY: "auto",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 12 }}>
        ⏱ Vue globale de mon Pointage
      </h2>
      <p style={{ textAlign: "center", marginBottom: 24 }}>
        État actuel : <strong>{etat || "Aucun"}</strong>
      </p>

      {/* Ligne 1 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={boxStyle("#e3f9ea", "#158a2e")}>
          <div style={titleStyle("#158a2e")}>Temps de travail</div>
          <div style={valueStyle}>{formatTime(totalDispo)}</div>
        </div>
        <div style={{ ...boxStyle("#fff7e6", "#c56f00"), flex: 2 }}>
          <div style={titleStyle("#c56f00")}>Toutes Pauses</div>
          <div
            style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}
          >
            {pausesForTotal.map((key) => {
              const status = statuses.find((s) => s.key === key);
              return (
                <div key={key} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 12 }}>{status?.statusFr}</div>
                  <div style={{ fontFamily: "monospace" }}>
                    {formatTime(
                      (timersByKey[key] || 0) +
                      (currentKey === key ? elapsed : 0)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ ...boxStyle("#ffeaea", "#c0392b", 2) }}>
          <div style={titleStyle("#c0392b")}>Toutes les indisponibilités</div>
          <div
            style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}
          >
            {indisposForTotal.map((key) => {
              const status = statuses.find((s) => s.key === key);
              return (
                <div key={key} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 12 }}>{status?.statusFr}</div>
                  <div style={{ fontFamily: "monospace" }}>
                    {formatTime(
                      (timersByKey[key] || 0) +
                      (currentKey === key ? elapsed : 0)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ligne 2 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 30 }}>
        <div style={boxStyle("#ebf1fe", "#3366cc", 2)}>
          <div style={titleStyle("#3366cc")}>Présence Total</div>
          <div style={valueStyle}>{formatTime(totalPresence)}</div>
        </div>
        <div style={boxStyle("#fff3e4", "#d97a00")}>
          <div style={titleStyle("#d97a00")}>Total Pauses</div>
          <div style={valueStyle}>{formatTime(totalPause)}</div>
        </div>
        <div style={boxStyle("#ffeaea", "#c0392b")}>
          <div style={titleStyle("#c0392b")}>Total Indisponible</div>
          <div style={valueStyle}>{formatTime(totalIndispo)}</div>
        </div>
      </div>

      {/* Boutons via StatusSelector */}
      <div className="flex flex-wrap gap-3 justify-center w-full mx-auto">
        <StatusSelector currentStatus={etat} onSelect={handleSelect} mode="buttons" />
      </div>
    </div>
  );
}

// Styles utilitaires
const boxStyle = (bg, color, flex = 1) => ({
  background: bg,
  borderRadius: 10,
  padding: 16,
  flex,
  textAlign: "center",
  border: `1px solid ${color}33`,
});
const titleStyle = (color) => ({
  fontWeight: 600,
  fontSize: 14,
  color,
  marginBottom: 6,
});
const valueStyle = {
  fontFamily: "monospace",
  fontSize: 22,
  color: "#333",
};
