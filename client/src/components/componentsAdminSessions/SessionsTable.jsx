import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, Eye, RotateCcw, Power } from "lucide-react";
import dayjs from "dayjs";
import axiosInstance from "../../api/axiosInstance";

export default function SessionsTable({ sessions, loading, refresh }) {
  // Timer live actualisé toutes les secondes
  const [now, setNow] = useState(dayjs());
  const [presenceElapsedMap, setPresenceElapsedMap] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatage en hh:mm:ss
  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return "00:00:00";
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Calcule durée cumulée + live pour la colonne "Depuis"
  const getDurationSince = (session) => {
    const { status, status_cumulative, start_time } = session;
    if (!start_time) return formatTime(status_cumulative || 0);

    // Durée en secondes depuis start_time à now
    const diffSeconds = Math.max(0, now.diff(dayjs(start_time), "second"));

    // Total : cumulée du backend + live depuis start_time
    const total = (status_cumulative || 0) + diffSeconds;

    return formatTime(total);
  };

  // Affiche présence totale (cumul journalier) depuis backend
  const getPresenceTotal = (session) => {
    const presence = session.presence_total;
    if (!presence) return "00:00:00";
    // Si présence déjà en secondes, formater, sinon afficher tel quel
    if (typeof presence === "number") return formatTime(presence);
    return presence;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <button
          onClick={refresh}
          className="flex items-center gap-2 py-1 px-3 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition"
        >
          <RefreshCw size={16} /> Rafraîchir
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Nom</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Prénom</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Statut actuel</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Depuis</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Présence Totale</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-blue-700">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" className="text-center py-6 text-gray-600 font-medium">Chargement...</td>
            </tr>
          ) : sessions.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-6 text-gray-500 italic">Aucune session trouvée</td>
            </tr>
          ) : (
            sessions.map((s) => (
              <tr key={s.id} className="border-t border-gray-200 hover:bg-blue-50">
                <td className="px-6 py-3 text-gray-800">{s.lastname}</td>
                <td className="px-6 py-3 text-gray-800">{s.firstname}</td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      s.status?.toLowerCase().includes("disponible")
                        ? "bg-green-100 text-green-800"
                        : s.status?.toLowerCase().includes("pause")
                        ? "bg-yellow-100 text-yellow-800"
                        : s.status?.toLowerCase().includes("indisponible")
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {s.status || "Inconnu"}
                  </span>
                </td>
                <td className="px-6 py-3 font-mono text-sm text-gray-700">{getDurationSince(s)}</td>
                <td className="px-6 py-3 font-mono text-sm text-gray-700">{getPresenceTotal(s)}</td>
                <td className="px-6 py-3 text-center flex justify-center gap-3">
                  <button className="text-blue-600 hover:text-blue-800" title="Voir détail">
                    <Eye size={18} />
                  </button>
                  <button className="text-yellow-600 hover:text-yellow-800" title="Relancer session">
                    <RotateCcw size={18} />
                  </button>
                  <button className="text-red-600 hover:text-red-800" title="Clôturer session">
                    <Power size={18} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
