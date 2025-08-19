// src/componentsAdminSessions/SessionsTable.jsx
import React, { useEffect, useState } from "react";
import { RefreshCw, Eye, RotateCcw, Power } from "lucide-react";
import dayjs from "dayjs";

export default function SessionsTable({ sessions, loading, refresh }) {
  const [timers, setTimers] = useState({});
  const [presenceTotals, setPresenceTotals] = useState({});

  // Mettre à jour les timers toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = {};
      const updatedPresence = {};

      sessions.forEach((s) => {
        const start = dayjs(s.start_time);
        const now = dayjs();

        // Durée sur statut actuel
        if (!s.end_time) {
          updatedTimers[s.id] = now.diff(start, "second");
        } else {
          updatedTimers[s.id] = dayjs(s.end_time).diff(start, "second");
        }

        // Présence totale de la journée (start_time -> maintenant si en cours)
        const dayStart = dayjs(s.start_time).startOf("day");
        if (!s.end_time) {
          updatedPresence[s.id] = now.diff(dayStart, "second");
        } else {
          updatedPresence[s.id] = dayjs(s.end_time).diff(dayStart, "second");
        }
      });

      setTimers(updatedTimers);
      setPresenceTotals(updatedPresence);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessions]);

  const formatDuration = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      {/* Header avec bouton Refresh */}
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
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
              Nom
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
              Prénom
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
              Email
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
              Statut actuel
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
              Depuis
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
              Présence totale
            </th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-blue-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan="7"
                className="text-center py-6 text-gray-600 font-medium"
              >
                Chargement...
              </td>
            </tr>
          ) : sessions.length === 0 ? (
            <tr>
              <td
                colSpan="7"
                className="text-center py-6 text-gray-500 italic"
              >
                Aucune session trouvée
              </td>
            </tr>
          ) : (
            sessions.map((s) => (
              <tr
                key={s.id}
                className="border-t border-gray-200 hover:bg-blue-50"
              >
                <td className="px-6 py-3 text-gray-800">{s.user?.lastname}</td>
                <td className="px-6 py-3 text-gray-800">{s.user?.firstname}</td>
                <td className="px-6 py-3 text-gray-600 break-all">
                  {s.user?.email}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold 
                      ${
                        s.status?.toLowerCase() === "actif"
                          ? "bg-green-100 text-green-800"
                          : s.status?.toLowerCase() === "pause"
                          ? "bg-yellow-100 text-yellow-800"
                          : s.status?.toLowerCase() === "inactif"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-3 font-mono text-sm text-gray-700">
                  {formatDuration(timers[s.id] || 0)}
                </td>
                <td className="px-6 py-3 font-mono text-sm text-gray-700">
                  {formatDuration(presenceTotals[s.id] || 0)}
                </td>
                <td className="px-6 py-3 text-center flex justify-center gap-3">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    title="Voir détail"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="text-yellow-600 hover:text-yellow-800"
                    title="Relancer session"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    title="Clôturer session"
                  >
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
