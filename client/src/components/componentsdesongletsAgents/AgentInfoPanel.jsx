// components/componentsdesonglets/AgentInfoPanel.jsx
import React, { useEffect, useRef } from "react";
import { Coffee, Utensils, BookOpenCheck, UserCheck, UserX, Clock5 } from 'lucide-react';
import { startSession, closeSession } from '../../api/saveSessionToDB';

// États disponibles et pauses
const STATES = {
  DISPO: "Disponible",
  INDISPO: "Indisponible",
  CAFE: "Pause Café",
  DEJEUNER: "Pause Déjeuner",
  FORMATION: "Formation",
  AUTRE: "Autre Pause",
};

const PAUSES = [STATES.CAFE, STATES.DEJEUNER, STATES.FORMATION, STATES.AUTRE];

// Formatage du temps en hh:mm:ss
const formatTime = (sec) => {
  if (typeof sec !== 'number' || isNaN(sec) || sec < 0) return "00:00:00";
  return new Date(sec * 1000).toISOString().substr(11, 8);
};

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
  setActiveItem,
}) {
  const intervalRef = useRef();

  useEffect(() => {
    if (!etat || !lastChange || isNaN(new Date(lastChange).getTime())) {
      setElapsed(0);
      clearInterval(intervalRef.current);
      return;
    }

    const update = () => {
      const diff = Math.floor((Date.now() - new Date(lastChange).getTime()) / 1000);
      setElapsed(diff >= 0 ? diff : 0);
    };

    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [etat, lastChange, setElapsed]);



  useEffect(() => {
    // Sauvegarde dans localStorage à chaque changement important
    try {
      localStorage.setItem("timers", JSON.stringify({
        etat,
        timers,
        lastChange: lastChange ? lastChange.toISOString() : null,
      }));
    } catch {
      // ignore localStorage errors
    }
  }, [etat, timers, lastChange]);


  const getPauseType = (etat) => {
    switch (etat) {
      case STATES.CAFE: return "pause_cafe";
      case STATES.DEJEUNER: return "pause_repas";
      case STATES.FORMATION: return "pause_formation";
      case STATES.AUTRE: return "pause_autre";
      default: return null;
    }
  };

  const handleClick = async (newEtat) => {

    if (!userId) {
      console.error("User ID manquant, impossible d'enregistrer la session");
      return;
    }

    if (etat && lastChange && !isNaN(new Date(lastChange).getTime())) {
      // Ajout durée passée sur l'état précédent dans timers
      const duree = Math.floor((Date.now() - new Date(lastChange).getTime()) / 1000);
      if (timers[etat] !== undefined && duree > 0) {
        timers[etat] += duree;
      }
    }

    try {
      // Fermer la session précédente (active)
      await closeSession(userId);
    } catch (error) {
      // Ignore 404 "Aucune session active trouvée"
      if (!error.message.includes('Aucune session active trouvée')) {
        console.error('Erreur fermeture session:', error);
        return;
      }
    }

    try {
      // Démarrer la nouvelle session avec le nouveau statut
      await startSession({
        userId,
        status: newEtat,
        pauseType: getPauseType(newEtat),
      });

      setEtat(newEtat);
      setLastChange(new Date());
      setElapsed(0);
      setTimers({ ...timers }); // trigger rerender
    } catch (error) {
      console.error('Erreur démarrage session:', error);
      // optionnel: afficher notification utilisateur
    }
  };

  const totalPause = PAUSES.reduce(
    (sum, p) => sum + (timers[p] || 0) + (etat === p ? elapsed : 0),
    0
  );
  const totalDispo = (timers[STATES.DISPO] || 0) + (etat === STATES.DISPO ? elapsed : 0);
  const totalIndispo = (timers[STATES.INDISPO] || 0) + (etat === STATES.INDISPO ? elapsed : 0);
  const totalPresence = totalDispo + totalPause + totalIndispo;

  const dynamicBtnStyle = (btnEtat, activeColor, textColor = "#fff") =>
    btnStyle(etat === btnEtat ? activeColor : "#ddd", etat === btnEtat ? textColor : "#333");

  return (
    <div
      style={{
        width: "100%",
        height: "90vh",
        padding: 24,
        background: "#f9fafb",
        borderRadius: 12,
        overflowY: "auto",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 12 }}>⏱ Vue globale de mon Pointage</h2>
      <p style={{ textAlign: "center", marginBottom: 24 }}>
        État actuel : <strong>{etat || "Aucun"}</strong>
      </p>

      {/* Ligne 1 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={boxStyle("#e3f9ea", "#158a2e")}>
          <div style={titleStyle("#158a2e")}>Disponible</div>
          <div style={valueStyle}>{formatTime(totalDispo)}</div>
        </div>
        <div style={{ ...boxStyle("#fff7e6", "#c56f00"), flex: 2 }}>
          <div style={titleStyle("#c56f00")}>Toutes Pauses</div>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {PAUSES.map((pause) => (
              <div key={pause} style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 12 }}>{pause.replace("Pause ", "")}</div>
                <div style={{ fontFamily: "monospace" }}>
                  {formatTime((timers[pause] || 0) + (etat === pause ? elapsed : 0))}
                </div>
              </div>
            ))}
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
          <div style={titleStyle("#c0392b")}>Indisponible</div>
          <div style={valueStyle}>{formatTime(totalIndispo)}</div>
        </div>
      </div>

      {/* Boutons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        <button
          onClick={() => handleClick(STATES.DISPO)}
          disabled={etat === STATES.DISPO}
          style={{
            ...dynamicBtnStyle(STATES.DISPO, "#27ae60"),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <UserCheck /> Disponible
        </button>
        <button
          onClick={() => handleClick(STATES.CAFE)}
          style={{
            ...dynamicBtnStyle(STATES.CAFE, "#f39c12"),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Coffee /> Pause Café
        </button>
        <button
          onClick={() => handleClick(STATES.DEJEUNER)}
          style={{
            ...dynamicBtnStyle(STATES.DEJEUNER, "#f1c40f", "#333"),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Utensils /> Déjeuner
        </button>
        <button
          onClick={() => handleClick(STATES.FORMATION)}
          style={{
            ...dynamicBtnStyle(STATES.FORMATION, "#3498db"),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <BookOpenCheck /> Formation
        </button>
        <button
          onClick={() => handleClick(STATES.AUTRE)}
          style={{
            ...dynamicBtnStyle(STATES.AUTRE, "#9b59b6"),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Clock5 /> Autre Pause
        </button>
        <button
          onClick={() => handleClick(STATES.INDISPO)}
          style={{
            ...dynamicBtnStyle(STATES.INDISPO, "#e74c3c"),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <UserX /> Indisponible
        </button>
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
const btnStyle = (bg, text = "#fff") => ({
  background: bg,
  color: text,
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  fontWeight: 600,
  fontSize: 15,
  cursor: "pointer",
});
