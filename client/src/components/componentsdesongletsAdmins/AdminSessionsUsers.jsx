import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";
import socket from "../../socket";

// Formatage hh:mm:ss
const formatTime = (sec) => {
  if (!sec || sec < 0) return "00:00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
};

export default function AdminLiveSessions() {
  const [agents, setAgents] = useState([]);
  const intervalRef = useRef();

  // Récupère les agents depuis le backend
  const fetchAgents = async () => {
    try {
      const res = await axiosInstance.get("/session_agents/user/live");
      const data = res.data.map(a => ({
        ...a,
        depuis_sec: a.depuis_sec || 0,
        presence_totale_sec: a.presence_totale_sec ?? 0,
        is_connected: a.is_connected ?? false,
      }));
      setAgents(data);
    } catch (err) {
      console.error("Erreur récupération sessions live:", err);
    }
  };

  useEffect(() => {
    fetchAgents();

    // Intervalle live pour incrémenter les timers
    intervalRef.current = setInterval(() => {
      setAgents(prev =>
        prev.map(a => {
          const statutValide = ["Disponible", "Pause", "Pause Café", "Pause Déjeuner", "Autre Pause", "Formation", "Indisponible"];
           if (!a.is_connected || !statutValide.includes(a.statut_actuel)) {
        return { ...a, depuis_sec: 0 };
      }
          return {
            ...a,
            depuis_sec: (a.depuis_sec ?? 0) + 1,
            presence_totale_sec: (a.presence_totale_sec ?? 0) + 1,
          };
        })
      );
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  // Gestion des déconnexions
  useEffect(() => {
    // Déconnexion
    socket.on("agent_disconnected", ({ userId }) => {
      setAgents(prev =>
        prev.map(a =>
          a.user_id === userId
            ? { ...a, statut_actuel: "Hors ligne", is_connected: false, depuis_sec: 0 }
            : a
        )
      );
    });

    // Connexion
    socket.on("agent_connected", ({ userId, depuis_sec }) => {
      setAgents(prev =>
        prev.map(a =>
          a.user_id === userId
            ? { ...a, statut_actuel: "En ligne", is_connected: true, depuis_sec: depuis_sec || 0 }
            : a
        )
      );
    });

    return () => {
      socket.off("agent_disconnected");
      socket.off("agent_connected");
    };
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">👥 Suivi en live des agents</h2>
      <table className="min-w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
        <thead className="bg-blue-100">
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
          {agents.map(a => (
            <tr key={a.user_id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-3">{a.lastname}</td>
              <td className="px-6 py-3">{a.firstname}</td>
              <td className="px-6 py-3">{a.statut_actuel}</td>
              <td className="px-6 py-3">{formatTime(a.depuis_sec)}</td>
              <td className="px-6 py-3">{formatTime(a.presence_totale_sec)}</td>
              <td className="px-6 py-3 text-center">
                <button
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => alert(`Consulter ${a.lastname} ${a.firstname}`)}
                >
                  Consulter
                </button>
              </td>
            </tr>
          ))}
          {agents.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center py-4 text-gray-500">
                Aucun agent connecté
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
