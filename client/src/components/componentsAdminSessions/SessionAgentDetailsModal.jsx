// src/components/admin/SessionAgentDetailsModal.jsx
import React, { useEffect, useCallback, useState } from "react";
import { X, Clock, CheckCircle2, ClockPlus, LogOut } from "lucide-react";
import { statuses } from '../../shared/StatusSelector';
import axiosInstance from "../../api/axiosInstance";

// Helper format
const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return "00:00:00";
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
};

export default function SessionAgentDetailsModal({ agent, onClose }) {
    const [liveCounters, setLiveCounters] = useState({});
    const [connectionTimes, setConnectionTimes] = useState({});

    const formatConnectionTime = (datetime) => {
        if (!datetime) return "--:--:--";
        const d = new Date(datetime);
        return isNaN(d.getTime()) ? "--:--:--" : d.toLocaleTimeString();
    };

    useEffect(() => {
        const fetchConnectionTimes = async () => {
            try {
                const res = await axiosInstance.get("/session_agents/user/agent_connection_details");
                // On récupère uniquement les infos pour l'agent actuel
                const userData = res.data.find(item => item.user_id == agent.user_id);
                if (userData) setConnectionTimes(userData);
            } catch (err) {
                console.error("Erreur récupération connexion agent:", err.response?.data || err.message);
            }
        };

        fetchConnectionTimes();
    }, [agent]);

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
      const pauseKeys = ['pause_cafe_1', 'pause_dejeuner', 'pause_cafe_2', 'pause_autre'];
  const totalPauses = pauseKeys.reduce((acc, key) => {
    const statusObj = statuses.find(s => s.key === key);
    if (!statusObj) return acc;
    const base = agent.cumul_statuts?.[statusObj.statusFr] || 0;
    const live = agent.statut_actuel === statusObj.statusFr ? (liveCounters[agent.statut_actuel] || 0) : 0;
    return acc + base + live;
  }, 0);

  // 🟡 Calcul total des indisponibilités
  const indispoKeys = ['reunion', 'pause_formation', 'brief'];
  const totalIndispo = indispoKeys.reduce((acc, key) => {
    const statusObj = statuses.find(s => s.key === key);
    if (!statusObj) return acc;
    const base = agent.cumul_statuts?.[statusObj.statusFr] || 0;
    const live = agent.statut_actuel === statusObj.statusFr ? (liveCounters[agent.statut_actuel] || 0) : 0;
    return acc + base + live;
  }, 0);


    // 🟡 Calcul présence totale
      const totalPresence = statuses.reduce((acc, { statusFr, key }) => {
    const base = agent.cumul_statuts?.[statusFr] || 0;
    const live = agent.statut_actuel === statusFr ? (liveCounters[agent.statut_actuel] || 0) : 0;
    return acc + base + live;
  }, 0);

    // 🟡 Connexion / Déconnexion du jour
    const heureConnexion = connectionTimes.first_connection || "—";
    const heureDeconnexion = connectionTimes.last_disconnection || "—";

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
                            <Detail
                                label="Heure de connexion"
                                value={formatConnectionTime(connectionTimes.first_connection)}
                                icon={<Clock size={18} className="text-green-500" />}
                            />
                            <Detail label="Statut actuel" value={agent.statut_actuel || "—"} icon={<CheckCircle2 size={18} className="text-blue-600" />} />
                            <Detail label="Présence totale" value={formatTime(totalPresence)} icon={<Clock size={18} className="text-green-700" />} />
                            {totalPauses > 0 && (
                                <Detail
                                    label="Total pauses"
                                    value={formatTime(totalPauses)}
                                    icon={<ClockPlus size={18} className="text-pink-700" />}
                                />
                            )}
                            {totalIndispo > 0 && (
                                <Detail
                                    label="Total indispo"
                                    value={formatTime(totalIndispo)}
                                    icon={<ClockPlus size={18} className="text-pink-700" />}
                                />
                            )}
                            <Detail
                                label="Heure de déconnexion"
                                value={formatConnectionTime(connectionTimes.last_disconnection)}
                                icon={<LogOut size={18} className="text-red-500" />}
                            />
                        </div>

                        {/* Colonne droite : temps par statut */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-1">
                                Temps par statut
                            </h3>
                            {statuses.map(({ key, statusFr, icon: Icon, color }) => {
                                const baseSeconds = agent.cumul_statuts?.[statusFr] || 0;
                                const liveSeconds = agent.statut_actuel === statusFr ? (liveCounters[statusFr] || 0) : 0;
                                const totalSeconds = baseSeconds + liveSeconds;

                                if (totalSeconds === 0) return null;

                                return (
                                    <Detail
                                        key={key}
                                        label={statusFr}
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
