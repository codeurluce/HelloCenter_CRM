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

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/session_agents/user/live", { params: filters });
      const data = res.data.map(a => ({
        ...a,
        depuis_sec: a.cumul_statuts?.[a.statut_actuel] ?? 0,
        presence_totale_sec: a.presence_totale_sec ?? 0,
        last_statut: a.statut_actuel,
      }));
      setAgents(data);
    } catch (err) {
      console.error("Erreur récupération sessions live:", err);
    } finally {
      setLoading(false);
    }
  };

  // Interval incrément
  useEffect(() => {
    fetchAgents();

    intervalRef.current = setInterval(() => {
      setAgents(prev =>
        prev.map(agent => {
          if (!agent.is_connected) return agent;

          const cumul = { ...agent.cumul_statuts };
          const lastStatut = agent.last_statut || agent.statut_actuel;

          if (agent.statut_actuel !== lastStatut) {
            cumul[lastStatut] = (cumul[lastStatut] ?? 0) + (agent.depuis_sec ?? 0);
            const newDepuis = cumul[agent.statut_actuel] ?? 0;
            return {
              ...agent,
              last_statut: agent.statut_actuel,
              depuis_sec: newDepuis,
              presence_totale_sec: (agent.presence_totale_sec ?? 0) + 1,
              cumul_statuts: cumul,
            };
          }

          return {
            ...agent,
            depuis_sec: (agent.depuis_sec ?? 0) + 1,
            presence_totale_sec: (agent.presence_totale_sec ?? 0) + 1,
            cumul_statuts: {
              ...cumul,
              [agent.statut_actuel]: (cumul[agent.statut_actuel] ?? 0) + 1,
            },
          };
        })
      );
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  // Sockets
  useEffect(() => {
    socket.on("agent_disconnected", ({ userId }) => {
      setAgents(prev =>
        prev.map(agent =>
          agent.user_id === userId
            ? { ...agent, statut_actuel: "Hors ligne", is_connected: false, depuis_sec: 0 }
            : agent
        )
      );
    });

    socket.on("agent_connected", ({ userId }) => {
      setAgents(prev =>
        prev.map(agent =>
          agent.user_id === userId
            ? { ...agent, statut_actuel: "En ligne", is_connected: true }
            : agent
        )
      );
    });

    return () => {
      socket.off("agent_disconnected");
      socket.off("agent_connected");
    };
  }, []);

  const handleApplyFilters = (f) => { setFilters(f); fetchAgents(); };
  const handleResetFilters = () => { setFilters({}); fetchAgents(); };
  const handleExport = (options) => { console.log("Export:", options); setShowExport(false); };

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
        <ExportModal agents={agents} onExport={handleExport} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
