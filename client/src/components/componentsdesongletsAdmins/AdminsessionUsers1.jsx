// src/pages/admin/AdminLiveSessions.jsx
import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";
import socket from "../../socket";
import SessionsTable from "../componentsAdminSessions/SessionsTable";
import SessionFilters from "../componentsAdminSessions/SessionFilters";
import ExportModal from "../componentsAdminSessions/ExportModal.jsx";
import { Download } from "lucide-react";

export default function AdminLiveSessions() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [showExport, setShowExport] = useState(false);
  const intervalRef = useRef();

  // --- Récupération agents avec cumul et currentStatus ---
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/session_agents/user/live", {
        params: filters,
      });
      const data = res.data.map((a) => ({
        ...a,
        depuis_sec: a.depuis_sec || 0,
        presence_totale_sec: a.presence_totale_sec ?? 0,
        is_connected: a.is_connected ?? false,
        currentStatus: a.statut_actuel,
        cumul_statuts: {
          [a.statut_actuel]: a.depuis_sec || 0,
        },
      }));
      setAgents(data);
    } catch (err) {
      console.error("Erreur récupération sessions live:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Interval d’incrémentation ---
  useEffect(() => {
    fetchAgents();

    intervalRef.current = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) => {
          const statutValide = [
            "Disponible",
            "Pause",
            "Pause Café",
            "Pause Déjeuner",
            "Autre Pause",
            "Formation",
            "Indisponible",
          ];

          if (!a.is_connected || !statutValide.includes(a.statut_actuel)) {
            return { ...a, depuis_sec: 0 };
          }

          const cumul = { ...(a.cumul_statuts || {}) };
          const prevStatus = a.currentStatus;

          if (a.statut_actuel !== prevStatus) {
            // Nouveau statut détecté, reprendre le cumul si existant
            return {
              ...a,
              currentStatus: a.statut_actuel,
              depuis_sec: cumul[a.statut_actuel] ?? 0,
              presence_totale_sec: (a.presence_totale_sec ?? 0) + 1,
              cumul_statuts: cumul,
            };
          }

          // Sinon incrémente normalement
          const nextDepuis = (a.depuis_sec ?? 0) + 1;
          cumul[a.statut_actuel] = nextDepuis;

          return {
            ...a,
            currentStatus: a.statut_actuel,
            depuis_sec: nextDepuis,
            presence_totale_sec: (a.presence_totale_sec ?? 0) + 1,
            cumul_statuts: cumul,
          };
        })
      );
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  // --- Sockets ---
  useEffect(() => {
    socket.on("agent_disconnected", ({ userId }) => {
      setAgents((prev) =>
        prev.map((a) =>
          a.user_id === userId
            ? {
                ...a,
                statut_actuel: "Hors ligne",
                is_connected: false,
                depuis_sec: 0,
              }
            : a
        )
      );
    });

    socket.on("agent_connected", ({ userId }) => {
      setAgents((prev) =>
        prev.map((a) =>
          a.user_id === userId
            ? {
                ...a,
                statut_actuel: "En ligne",
                is_connected: true,
                // Ne touche pas à depuis_sec, on reprend la valeur existante
              }
            : a
        )
      );
    });

    return () => {
      socket.off("agent_disconnected");
      socket.off("agent_connected");
    };
  }, []);

  // --- Filtres ---
  const handleApplyFilters = (f) => {
    setFilters(f);
    fetchAgents();
  };
  const handleResetFilters = () => {
    setFilters({});
    fetchAgents();
  };

  // --- Export ---
  const handleExport = (options) => {
    console.log("Export avec filtres :", options);
    setShowExport(false);
    // TODO: requête backend export
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">👥 Suivi en live des agents</h2>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Download size={16} /> Exporter
        </button>
      </div>

      <div className="mb-4">
        <SessionFilters onApply={handleApplyFilters} onReset={handleResetFilters} />
      </div>

      <SessionsTable sessions={agents} loading={loading} refresh={fetchAgents} />

      {showExport && (
        <ExportModal
          agents={agents}
          onExport={handleExport}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
