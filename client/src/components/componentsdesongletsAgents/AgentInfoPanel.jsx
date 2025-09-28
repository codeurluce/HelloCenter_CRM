// components/componentsdesonglets/AgentInfoPanel.jsx
import React from "react";
import { startSession, closeSession } from "../../api/saveSessionToDB";
import StatusSelector, { statuses, formatTime } from "../../shared/StatusSelector.jsx";

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
  onStatusChange, // ← utilise la fonction du parent
}) {

  // 📌 Pas d'appel API ici → tout vient du parent

  // Gestion du clic / sélection d'un nouvel état
  const handleSelect = async (newEtatFr, pause) => {
    if (!userId) {
      console.error("User ID manquant");
      return;
    }

    // Appel direct de la logique du parent
    onStatusChange(newEtatFr, pause);

    // Appels backend
    try {
      await closeSession({ user_id: userId });
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || '';
      if (!msg.includes("Aucune session active") && !msg.includes("no active session")) {
        console.error("Erreur fermeture session:", error);
        return;
      }
    }

    // Déterminer pauseType (ex: 'cafe' si status key commence par 'pause_')
    const newStatusObj = statuses.find((s) => s.statusFr === newEtatFr);
    const pauseType = pause || (newStatusObj?.key?.startsWith("pause_") 
      ? newStatusObj.key.split("_")[1] 
      : null);

          // Démarrer nouvelle session en base (INSERT)
    try {
      await startSession({ user_id: userId, status: newEtatFr, pause_type: pauseType });
    } catch (error) {
      console.error("Erreur démarrage session:", error);
    }
  };

  // Calculs
  const timersByKey = timers;
  const currentKey = statuses.find((s) => s.statusFr === etat)?.key || null;
  const pausesForTotal = ["pause_cafe_1", "pause_dejeuner", "pause_cafe_2"];
  const indisposForTotal = ["reunion", "pause_formation", "brief"];
  const dispoStatus = statuses.find((s) => s.key === "disponible");

  const totalDispo = (timersByKey[dispoStatus?.key] || 0) + (currentKey === dispoStatus?.key ? elapsed : 0);
  const totalPause = pausesForTotal.reduce((sum, key) => sum + (timersByKey[key] || 0) + (currentKey === key ? elapsed : 0), 0);
  const totalIndispo = indisposForTotal.reduce((sum, key) => sum + (timersByKey[key] || 0) + (currentKey === key ? elapsed : 0), 0);
  const totalPresence = totalDispo + totalPause + totalIndispo;

  console.log("📊 AgentInfoPanel - props reçues:", { etat, elapsed, timers });
  return (
    <div style={{ width: "100%", minHeight: "90vh", padding: 24, background: "#f9fafb", borderRadius: 12, overflowY: "auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 12 }}>⏱ Vue globale de mon Pointage</h2>
      
      {!etat && (
        <p style={{ textAlign: "center", marginBottom: 24, color: "orange" }}>
          ⚠️ Veuillez sélectionner votre statut pour démarrer le suivi.
        </p>
      )}

      {etat && (
        <p style={{ textAlign: "center", marginBottom: 24 }}>
          État actuel : <strong>{etat}</strong>
        </p>
      )}

      {/* Ligne 1 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={boxStyle("#e3f9ea", "#158a2e")}>
          <div style={titleStyle("#158a2e")}>Temps de travail</div>
          <div style={valueStyle}>{formatTime(totalDispo)}</div>
        </div>
        <div style={{ ...boxStyle("#fff7e6", "#c56f00"), flex: 2 }}>
          <div style={titleStyle("#c56f00")}>Toutes Pauses</div>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {pausesForTotal.map((key) => {
              const status = statuses.find((s) => s.key === key);
              return (
                <div key={key} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 12 }}>{status?.statusFr}</div>
                  <div style={{ fontFamily: "monospace" }}>
                    {formatTime((timersByKey[key] || 0) + (currentKey === key ? elapsed : 0))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ ...boxStyle("#ffeaea", "#c0392b", 2) }}>
          <div style={titleStyle("#c0392b")}>Toutes les indisponibilités</div>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {indisposForTotal.map((key) => {
              const status = statuses.find((s) => s.key === key);
              return (
                <div key={key} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 12 }}>{status?.statusFr}</div>
                  <div style={{ fontFamily: "monospace" }}>
                    {formatTime((timersByKey[key] || 0) + (currentKey === key ? elapsed : 0))}
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

      {/* Boutons */}
      <div className="flex flex-wrap gap-3 justify-center w-full mx-auto">
        <StatusSelector currentStatus={etat} onSelect={handleSelect} mode="buttons" />
      </div>
    </div>
  );
}

// Styles
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