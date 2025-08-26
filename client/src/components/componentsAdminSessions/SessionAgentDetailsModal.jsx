// src/components/admin/SessionAgentDetailsModal.jsx
import React, { useEffect, useCallback, useState } from "react";
import {
  X, Clock, CheckCircle2, Coffee, Utensils, BookOpen,
  MoreHorizontal, XCircle, Timer, ClockPlus, LogOut
} from "lucide-react";

// Helper format
const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return "00:00:00";
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// Liste des statuts suivis
const STATUS_CONFIG = [
  { key: "Disponible", label: "Disponible", icon: CheckCircle2, color: "text-green-600" },
  { key: "Pause Café", label: "Pause Café", icon: Coffee, color: "text-yellow-600" },
  { key: "Pause Déjeuner", label: "Pause Déjeuner", icon: Utensils, color: "text-orange-600" },
  { key: "Pause Formation", label: "Formation", icon: BookOpen, color: "text-blue-600" },
  { key: "Autre Pause", label: "Autre Pause", icon: MoreHorizontal, color: "text-purple-600" },
  { key: "Indisponible", label: "Indisponible", icon: XCircle, color: "text-red-600" },
];

export default function SessionAgentDetailsModal({ agent, onClose }) {
  const [liveCounters, setLiveCounters] = useState({});

  // 🟡 Timer en live pour le statut actuel
  useEffect(() => {
    if (!agent?.statut_actuel) return;

    const interval = setInterval(() => {
      setLiveCounters((prev) => {
        const current = prev[agent.statut_actuel] || 0;
        return { ...prev, [agent.statut_actuel]: current + 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [agent?.statut_actuel]);

  // Fermer avec Echap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const stopPropagation = useCallback((e) => e.stopPropagation(), []);
  if (!agent) return null;

  // 🟡 Calcul total des pauses
const totalPauses = ["Pause Café", "Pause Déjeuner", "Pause Formation", "Autre Pause"]
  .reduce((acc, key) => {
    const base = agent.cumul_statuts?.[key] || 0;
    const live = agent.statut_actuel === key ? (liveCounters[key] || 0) : 0;
    return acc + base + live;
  }, 0);

  // 🟡 Calcul présence totale
  const totalPresence = STATUS_CONFIG.reduce((acc, { key }) => {
    const base = agent.cumul_statuts?.[key] || 0;
    const live = agent.statut_actuel === key ? (liveCounters[key] || 0) : 0;
    return acc + base + live;
  }, 0);

  // 🟡 Connexion / Déconnexion du jour
  const heureConnexion = agent.first_connection || "—";
  const heureDeconnexion = agent.last_disconnect || "—";

  return (
    <div
  className="fixed inset-0 bg-black/10 flex items-center justify-center z-50"
  onClick={onClose}
>
  <div
    className="bg-white rounded-xl border border-gray-100 max-w-3xl w-full overflow-hidden"
    onClick={stopPropagation}
  >
        {/* Header */}
        <div className="bg-blue-600 text-white flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock size={22} />
            <h3 className="text-lg font-bold">
              Détails de la session : {agent.firstname} {agent.lastname}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6 overflow-y-auto text-gray-800">
          <div className="grid grid-cols-2 gap-8">
            {/* Colonne gauche : infos session */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-1">
                Informations session
              </h3>
              <Detail label="Heure de connexion" value={heureConnexion} icon={<Clock size={18} className="text-gray-600" />} />
              <Detail label="Statut actuel" value={agent.statut_actuel || "—"} icon={<CheckCircle2 size={18} className="text-blue-600" />} />
              <Detail label="Présence totale" value={formatTime(totalPresence)} icon={<Clock size={18} className="text-gray-500" />} />
              {totalPauses > 0 && (
                <Detail
                  label="Total pauses"
                  value={formatTime(totalPauses)}
                  icon={<ClockPlus size={18} className="text-pink-600" />}
                />
              )}
              <Detail label="Heure de déconnexion" value={heureDeconnexion} icon={<LogOut size={18} className="text-gray-600" />} />
            </div>

            {/* Colonne droite : temps par statut */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-1">
                Temps par statut
              </h3>
              {STATUS_CONFIG.map(({ key, label, icon: Icon, color }) => {
                const baseSeconds = agent.cumul_statuts?.[key] || 0;
                const liveSeconds = agent.statut_actuel === key ? (liveCounters[key] || 0) : 0;
                const totalSeconds = baseSeconds + liveSeconds;

                if (totalSeconds === 0) return null;

                return (
                  <Detail
                    key={key}
                    label={label}
                    value={formatTime(totalSeconds)}
                    icon={<Icon size={18} className={color} />}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end bg-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg shadow-sm transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

const Detail = ({ label, value, icon }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100">
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-medium text-gray-700">{label} :</span>
    </div>
    <span className={value === "-" ? "text-gray-400 italic" : "text-gray-900 font-mono"}>
      {value}
    </span>
  </div>
);
