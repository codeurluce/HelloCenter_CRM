import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Download } from "lucide-react";
import { exportData } from "../utils/exportUtils";
import axiosInstance from "../../api/axiosInstance";
import Swal from "sweetalert2";
import StatusSelector, { statuses, formatTime } from "../../shared/StatusSelector.jsx";
import AgentWorkSummary from "./AgentWorkSummary.jsx";

export default function AgentInfoPanel({ userId, etat, timers, currentSession, onStatusChange }) {
  const [elapsed, setElapsed] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Actualisation timer elapsed depuis start_time en session
  useEffect(() => {
    if (!currentSession?.start_time) return;
    const startTime = new Date(currentSession.start_time).getTime();
    setElapsed(Math.floor((Date.now() - startTime) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession?.start_time]);

const handleExport = async () => {
  try {
    const { data: rows } = await axiosInstance.post("/session_agents/export-sessions-agent", {
      userId,
      startDate,
      endDate,
    });

    // Fonction format secondes → HH:mm:ss
    const formatSeconds = (sec) => {
      if (!sec || sec <= 0) return "00:00:00";
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const dataToExport = rows.map((row) => {
      const date = row.first_connection ? dayjs(row.first_connection).format("YYYY-MM-DD") : "-";
      const heureConnexion = row.first_connection ? dayjs(row.first_connection).format("HH:mm:ss") : "-";
      const heureDeconnexion = row.last_disconnection ? dayjs(row.last_disconnection).format("HH:mm:ss") : "-";

      const cumul = row.cumul_statuts || {};

      return {
        "Date": date,
        "Heure de connexion": heureConnexion,
        "Heure de déconnexion": heureDeconnexion,
        "Total des pauses": formatSeconds(
          (cumul["Pausette 1"] || 0) +
          (cumul["Déjeuner"] || 0) +
          (cumul["Pausette 2"] || 0)
        ),
        "Total des indisponibilités": formatSeconds(
          (cumul["Réunion"] || 0) +
          (cumul["Brief"] || 0) +
          (cumul["Formation"] || 0)
        ),
        "Temps de travail": formatSeconds(cumul["Disponible"] || 0),
        "Pausette 1": formatSeconds(cumul["Pausette 1"] || 0),
        "Pause Déjeuner": formatSeconds(cumul["Déjeuner"] || 0),
        "Pausette 2": formatSeconds(cumul["Pausette 2"] || 0),
        "Réunion": formatSeconds(cumul["Réunion"] || 0),
        "Formation": formatSeconds(cumul["Formation"] || 0),
        "Brief": formatSeconds(cumul["Brief"] || 0),
        "Prénom": row.firstname || "",
        "Nom": row.lastname || "",
        "Agent": `${row.firstname || ""} ${row.lastname || ""}`.trim(),
      };
    });

    // Utilise la même fonction utilitaire d’export que l’admin
    exportData(dataToExport, `export_${rows[0]?.firstname || "agent"}`);
  } catch (error) {
    console.error("Erreur export:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur export",
      text: error?.response?.data?.error || "Erreur lors de l’export des données.",
      confirmButtonColor: "#dc2626",
    });
  }
};


  // Calculs totaux
  const timersByKey = timers;
  const currentKey = currentSession ? statuses.find(s => s.statusFr === currentSession.status)?.key : null;
  const pausesForTotal = ["pause_cafe_1", "pause_dejeuner", "pause_cafe_2"];
  const indisposForTotal = ["reunion", "pause_formation", "brief"];
  const dispoStatus = statuses.find(s => s.key === "disponible");

  const totalDispo = (timersByKey[dispoStatus?.key] || 0) + (currentKey === dispoStatus?.key ? elapsed : 0);
  const totalPause = pausesForTotal.reduce((sum, key) =>
    sum + (timersByKey[key] || 0) + (currentKey === key ? elapsed : 0), 0);
  const totalIndispo = indisposForTotal.reduce((sum, key) =>
    sum + (timersByKey[key] || 0) + (currentKey === key ? elapsed : 0), 0);
  const totalPresence = totalDispo + totalPause + totalIndispo;

  const handleSelect = (newEtatFr, pause) => {
    if (!userId) {
      console.error("User ID manquant");
      return;
    }
    onStatusChange(newEtatFr, pause);
  };

  return (
    <>
          {/* Export date range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6">
        {/*<div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Date de début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Date de fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
        </div>

         <button
          onClick={handleExport}
          disabled={isExporting}
          className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Export en cours..." : "Exporter mes données"}
        </button> */}
      </div>
      
    <div style={{ width: "100%", padding: 24, background: "#f9fafb", borderRadius: 12, overflowY: "auto" }}>
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
    <div className="pt-24">
      <AgentWorkSummary />
      </div> 

    </>
  );
}

// Styles as in your code
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
