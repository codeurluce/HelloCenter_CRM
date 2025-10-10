import React, { useState, useEffect } from "react";
import { RefreshCw, Eye, LogOut, Pause, } from "lucide-react";
import SessionAgentDetailsModal from "./SessionAgentDetailsModal";
import axiosInstance from "../../api/axiosInstance";
import Swal from "sweetalert2";
import { toast } from "react-toastify"

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
  if (!status) return "En ligne";
  if (status.toLowerCase().includes("inactif")) return "En ligne";
  return status;
};

// Génère le tooltip du cumul par statut
const renderTooltip = (cumul) => {
  if (!cumul) return "";
  return Object.entries(cumul)
    .map(([statut, sec]) => `${statut}: ${formatTime(sec)}`)
    .join("\n");
};

//  Met en pause forcé un agent
const handleForcePause = async (agentId, firstname, lastname) => {
  const result = await Swal.fire({
    title: `Mettre ${firstname} ${lastname} en pause ?`,
    text: "L'agent sera forcé en pause déjeuner.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Oui, mettre en pause",
    cancelButtonText: "Annuler",
    confirmButtonColor: "#f1c40f",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    await axiosInstance.post(`/session_agents/${agentId}/forcePause`);
    toast.success(`${firstname} est maintenant en pause.`);
  } catch (err) {
    console.error("Erreur mise en pause agent :", err.response?.data || err.message);
    toast.error(err.response?.data?.error || "Impossible de mettre l'agent en pause");
  }
};

//  Déconnecté un agent
const handleDisconnect = async (agentId, firstname, lastname) => {
  // Afficher une confirmation
  const result = await Swal.fire({
    title: `Déconnecter ${firstname} ${lastname} `,
    text: "Êtes-vous sûr de vouloir déconnecter cet agent ?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Oui, déconnecter",
    cancelButtonText: "Annuler",
    confirmButtonColor: "#dc2626",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return; // Si l'utilisateur annule, on sort

  // Sinon, on effectue la déconnexion
  try {
    await axiosInstance.post(`/agent/${agentId}/disconnectByAdmin`);
    toast.success("Agent déconnecté avec succès");
  } catch (err) {
    console.error("Erreur déconnexion agent :", err.response?.data || err.message);
    toast.error(err.response?.data?.error || "Impossible de déconnecter l'agent");
  }
};

export default function SessionsTable({ sessions, loading, refresh }) {
  const [tick, setTick] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState(null);

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
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold cursor-default ${getDisplayStatus(s) === "Disponible"
                      ? "bg-green-200 text-green-900"
                      : getDisplayStatus(s).includes("Pause") || getDisplayStatus(s).includes("Pausette")
                        ? "bg-yellow-200 text-yellow-900"
                        : getDisplayStatus(s).includes("Déjeuner")
                          ? "bg-yellow-200 text-yellow-900"
                          : getDisplayStatus(s).includes("Formation")
                            ? "bg-red-200 text-red-900"
                            : getDisplayStatus(s).includes("Réunion")
                              ? "bg-red-200 text-red-900"
                              : getDisplayStatus(s).includes("Brief")
                                ? "bg-red-200 text-red-900"
                                //   ? "bg-teal-200 text-teal-900"
                                : getDisplayStatus(s).includes("En ligne")
                                  ? "bg-green-50 text-green-500"
                                  // : getDisplayStatus(s).includes("Indisponible")
                                  //   ? "bg-red-100 text-red-800"
                                  : getDisplayStatus(s).includes("Hors ligne") || getDisplayStatus(s).includes("Déconnecté")
                                    ? "bg-gray-300 text-gray-700"
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
                  {/* Bouton consulter */}
                  <div className="relative group">
                    <button
                      onClick={() => setSelectedAgent(s)}
                      title=""
                      className="px-3 py-1.5 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white 
                                                        transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-105"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-blue-600 text-white text-xs whitespace-nowrap">
                      Consulter
                    </span>
                  </div>

                  {/* Bouton Forcer la pause */}
                  <div className="relative group">
                    <button
                      onClick={() => handleForcePause(s.user_id, s.firstname, s.lastname)}
                      title=""
                      className="px-3 py-1.5 rounded-lg border border-yellow-100 text-yellow-600 hover:bg-yellow-600 hover:text-white transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-105"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                    <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-yellow-600 text-white text-xs whitespace-nowrap">
                      Mettre en pause
                    </span>
                  </div>

                  {/* Bouton deconnexion */}
                  <div className="relative group">
                    <button
                      onClick={() => handleDisconnect(s.user_id, s.firstname, s.lastname)}
                      title=""
                      className="px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-600 hover:text-white 
                                                        transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-105"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                    <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-red-600 text-white text-xs whitespace-nowrap">
                      Deconnexion
                    </span>
                  </div>
                  {selectedAgent && (
                    <SessionAgentDetailsModal
                      agent={selectedAgent}
                      onClose={() => setSelectedAgent(null)}
                    />)}
                  {/* <button className="text-yellow-600 hover:text-yellow-800" title="Forcer Pause"><Pause size={18} /></button>
                  <button className="text-green-600 hover:text-green-800" title="Mettre en disponible"><Play size={18} /></button> */}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
