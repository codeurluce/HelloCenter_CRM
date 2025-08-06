// components/componentsdesonglets/AgentInfoPanel.jsx

import React, { useEffect, useRef, useState } from "react";
import { Coffee, Utensils, BookOpenCheck, UserCheck, UserX, Clock5 } from 'lucide-react';

const STATES = {
  DISPO: "Disponible",
  INDISPO: "Indisponible",
  CAFE: "Pause Café",
  DEJEUNER: "Pause Déjeuner",
  FORMATION: "Formation",
  AUTRE: "Autre Pause",
};

const PAUSES = [STATES.CAFE, STATES.DEJEUNER, STATES.FORMATION, STATES.AUTRE];

const formatTime = (sec) => new Date(sec * 1000).toISOString().substr(11, 8);

export default function AgentInfoPanel() {
  const initial = JSON.parse(localStorage.getItem("timers") || "{}");

  const [etat, setEtat] = useState(initial.etat || null);
  const [timers, setTimers] = useState(initial.timers || {
    [STATES.DISPO]: 0,
    [STATES.CAFE]: 0,
    [STATES.DEJEUNER]: 0,
    [STATES.FORMATION]: 0,
    [STATES.AUTRE]: 0,
    [STATES.INDISPO]: 0,
  });
  const [lastChange, setLastChange] = useState(initial.lastChange ? new Date(initial.lastChange) : null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef();

  useEffect(() => {
    if (!etat) {
      setElapsed(0);
      clearInterval(intervalRef.current);
      return;
    }
    const update = () => {
      setElapsed(Math.floor((Date.now() - lastChange.getTime()) / 1000));
    };
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [etat, lastChange]);

  useEffect(() => {
    localStorage.setItem("timers", JSON.stringify({ etat, timers, lastChange }));
  }, [etat, timers, lastChange]);

  const handleClick = (newEtat) => {
    if (etat && lastChange) {
      const duree = Math.floor((Date.now() - lastChange.getTime()) / 1000);
      if (timers[etat] !== undefined) {
        timers[etat] += duree;
      }
    }
    setEtat(newEtat);
    setLastChange(new Date());
    setElapsed(0);
    setTimers({ ...timers });
  };

  const totalPause = PAUSES.reduce((sum, p) => sum + timers[p] + (etat === p ? elapsed : 0), 0);
  const totalDispo = timers[STATES.DISPO] + (etat === STATES.DISPO ? elapsed : 0);
  const totalIndispo = timers[STATES.INDISPO] + (etat === STATES.INDISPO ? elapsed : 0);
  const totalPresence = totalDispo + totalPause + totalIndispo;

  // 🔄 Style dynamique des boutons
  const dynamicBtnStyle = (btnEtat, activeColor, textColor = "#fff") =>
    btnStyle(etat === btnEtat ? activeColor : "#ddd", etat === btnEtat ? textColor : "#333");

  return (
    <div style={{
      width: "100%",
      height: "90vh",
      padding: "24px",
      background: "#f9fafb",
      borderRadius: 12,
      overflowY: "auto",
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 12 }}>⏱ Suivi Temps Agent</h2>
      <p style={{ textAlign: "center", marginBottom: 24 }}>
        État actuel : <strong>{etat || "Aucun"}</strong>
      </p>

      {/* 🟢 Ligne 1 – Disponible + Pauses + Indisponible */}
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
                  {formatTime(timers[pause] + (etat === pause ? elapsed : 0))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🟡 Ligne 2 – Total Pauses + Présence + Indispo */}
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

      {/* 🔘 Boutons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        <button onClick={() => handleClick(STATES.DISPO)} disabled={etat === STATES.DISPO} style={{
          ...dynamicBtnStyle(STATES.DISPO, "#27ae60"),
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <UserCheck /> Disponible
        </button>
        <button onClick={() => handleClick(STATES.CAFE)} style={{
          ...dynamicBtnStyle(STATES.CAFE, "#f39c12"),
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <Coffee /> Pause Café
        </button>
        <button onClick={() => handleClick(STATES.DEJEUNER)} style={{
          ...dynamicBtnStyle(STATES.DEJEUNER, "#f1c40f", "#333"),
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <Utensils /> Déjeuner
        </button>
        <button onClick={() => handleClick(STATES.FORMATION)} style={{
          ...dynamicBtnStyle(STATES.FORMATION, "#3498db"),
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <BookOpenCheck /> Formation
        </button>
        <button onClick={() => handleClick(STATES.AUTRE)} style={{
          ...dynamicBtnStyle(STATES.AUTRE, "#9b59b6"),
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <Clock5 /> Autre Pause
        </button>
        <button onClick={() => handleClick(STATES.INDISPO)} style={{
          ...dynamicBtnStyle(STATES.INDISPO, "#e74c3c"),
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <UserX /> Indisponible
        </button>
      </div>
    </div>
  );
}

// 🎨 Styles utilitaires
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
