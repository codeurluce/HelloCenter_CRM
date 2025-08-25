import React, { useState, useEffect } from "react";
import { RefreshCw, Eye, RotateCcw, Power } from "lucide-react";

// Formatage hh:mm:ss
const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return "00:00:00";
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// Traduction / affichage du statut
const getDisplayStatus = (session) => {
  if (!session.is_connected) return "Hors connexion";
  const status = session.statut_actuel || session.status || "";
  if (!status) return "En ligne mais inactif";
  if (status.toLowerCase().includes("inactif")) return "En ligne mais inactif";
  return status;
};

// Génère le tooltip du cumul par statut
const renderTooltip = (cumul) => {
  if (!cumul) return "";
  return Object.entries(cumul)
    .map(([statut, sec]) => `${statut}: ${formatTime(sec)}`)
    .join("\n");
};

export default function SessionsTable({ sessions, loading, refresh }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

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
              <tr key={s.user_id || s.id} className="border-t border-gray-200 hover:bg-blue-50">
                <td className="px-6 py-3 text-gray-800">{s.lastname}</td>
                <td className="px-6 py-3 text-gray-800">{s.firstname}</td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold cursor-default ${
                      getDisplayStatus(s) === "Disponible"
                        ? "bg-green-100 text-green-800"
                        : getDisplayStatus(s).includes("Pause")
                        ? "bg-yellow-100 text-yellow-800"
                        : getDisplayStatus(s).includes("Indisponible")
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                    title={renderTooltip(s.cumul_statuts)}
                  >
                    {getDisplayStatus(s)}
                  </span>
                </td>
                <td className="px-6 py-3 font-mono text-sm text-gray-700">
                  {(!s.is_connected || !s.statut_actuel) ? "00:00:00" : formatTime(s.depuis_sec)}
                </td>
                <td className="px-6 py-3 font-mono text-sm text-gray-700">{formatTime(s.presence_totale_sec)}</td>
                <td className="px-6 py-3 text-center flex justify-center gap-3">
                  <button className="text-blue-600 hover:text-blue-800" title="Voir détail"><Eye size={18} /></button>
                  <button className="text-yellow-600 hover:text-yellow-800" title="Relancer session"><RotateCcw size={18} /></button>
                  <button className="text-red-600 hover:text-red-800" title="Clôturer session"><Power size={18} /></button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
