// src/pages/admin/AdminLiveSessions.jsx (ou AdminSessionsUsers.jsx selon ton arbo)
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

  // Etats de la barre de filtre/recherche
  const [q, setQ] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState("");

  const [showExport, setShowExport] = useState(false);
  const intervalRef = useRef();

  // Statuts qui incrémentent un timer (hors connexion exclu)
  const STATUTS_VALIDES = [
    "Disponible",
    "Pause Café",
    "Pause Déjeuner",
    "Autre Pause",
    "Formation",
    "Indisponible",
  ];

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // On récupère tout ; le filtrage est fait côté front (comme dans AdministrationUsers)
      const res = await axiosInstance.get("/session_agents/user/live");
      const data = res.data.map((a) => ({
        ...a,
        depuis_sec: STATUTS_VALIDES.includes(a.statut_actuel)
          ? a.cumul_statuts?.[a.statut_actuel] ?? 0
          : 0,
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

  // Récup init + tick d'une seconde pour les compteurs
  useEffect(() => {
    fetchAgents();

    intervalRef.current = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (!agent.is_connected) return agent;

          const cumul = { ...agent.cumul_statuts };
          const lastStatut = agent.last_statut || agent.statut_actuel;

          if (!STATUTS_VALIDES.includes(agent.statut_actuel)) {
            return { ...agent, depuis_sec: 0, last_statut: agent.statut_actuel };
          }

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
  }, []); // ← pas de dépendances sur q/status : on filtre en front

  // Sockets connexion / déconnexion
  useEffect(() => {
    socket.on("agent_disconnected", ({ userId }) => {
      setAgents((prev) =>
        prev.map((agent) =>
          agent.user_id === userId
            ? { ...agent, statut_actuel: "Hors connexion", is_connected: false, depuis_sec: 0 }
            : agent
        )
      );
    });

    socket.on("agent_connected", ({ userId }) => {
      setAgents((prev) =>
        prev.map((agent) =>
          agent.user_id === userId
            ? { ...agent, is_connected: true, depuis_sec: 0 }
            : agent
        )
      );
    });

    return () => {
      socket.off("agent_disconnected");
      socket.off("agent_connected");
    };
  }, []);

  // ---- Filtrage côté front (comme ta page AdministrationUsers) ----
  const normalize = (s = "") =>
    s.toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  const filteredAgents = agents.filter((a) => {
    const haystack = normalize(
      `${a.lastname || ""} ${a.firstname || ""} ${a.email || ""} ${a.univers || ""}`
    );
    const okSearch = q.trim() === "" ? true : haystack.includes(normalize(q));
    const okStatus =
      sessionStatusFilter === "" ? true : a.statut_actuel === sessionStatusFilter;

    return okSearch && okStatus;
  });

  // ----------------------------------------------------------------

  const handleExport = () => setShowExport(false);

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
        <SessionFilters
          q={q}
          setQ={setQ}
          sessionStatusFilter={sessionStatusFilter}
          setSessionStatusFilter={setSessionStatusFilter}
          onResetPage={() => {}}
        />
      </div>

      <SessionsTable 
      sessions={filteredAgents} 
      loading={loading} 
      refresh={fetchAgents} 
      />

      {showExport && (
        <ExportModal
          agents={filteredAgents}
          onExport={handleExport}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
