// src/pages/admin/AdminLiveSessions.jsx (ou AdminSessionsUsers.jsx selon ton arbo)
import React, { useEffect, useState, useRef } from "react";
import { Upload } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import socket from "../../socket";
import SessionsTable from "../componentsAdminSessions/SessionsTable";
import SessionFilters from "../componentsAdminSessions/SessionFilters";
import ExportModal from "../componentsAdminSessions/ExportModalSessions.jsx";
import { statuses } from '../../shared/StatusSelector';
import { useAgentStatus } from "../../api/AgentStatusContext.jsx";
import AdminWorkTable from "../componentsAdminSessions/AdminWorkTable.jsx";

export default function AdminLiveSessions() {
  const { user } = useAgentStatus();

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

    const role = localStorage.getItem("role");
    const isAdmin = role === "Admin";
    const isManager = role === "Manager";
    const isAdminOrManager = isAdmin || isManager;

  // Etats de la barre de filtre/recherche
  const [q, setQ] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState("");

  const [showExport, setShowExport] = useState(false);
  const intervalRef = useRef();


  // Statuts qui incrémentent un timer (hors connexion exclu)
  const STATUTS_VALIDES = statuses.map(status => status.statusFr);

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
        sessions: [{
          date: a.date || new Date().toISOString(),
          first_connection: a.first_connection || "-",
          last_disconnection: a.last_disconnection || "-",
          total_presence: a.presence_totale_sec ?? 0,
          time_available: a.cumul_statuts?.Disponible ?? 0,
          time_pause: a.cumul_statuts?.["Pause Café"] ?? 0,
          time_unavailable: a.cumul_statuts?.Indisponible ?? 0,
        }],
      }));
      setAgents(data);
    } catch (err) {
      console.error("Erreur récupération sessions live:", err.response?.data || err.message);
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
          // if (!agent.is_connected) return agent;

          if (!agent.is_connected) {
            return {
              ...agent,
              statut_actuel: "Hors connexion",
              last_statut: "Hors connexion",
              depuis_sec: 0
            };
          }
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

  socket.on("connect", () => {
  console.log("[FRONT] Socket connecté, id =", socket.id);
});

  // Sockets connexion / déconnexion
useEffect(() => {
  if (!user?.id) return;

  // Auth du socket
  socket.auth = { userId: user.id, role: user.role || "Admin" };

  // Fonction pour s'abonner aux events après connexion
  const subscribeSocketEvents = () => {
    console.log("[FRONT] Socket connecté, id =", socket.id);

    // Déconnexion
    socket.on("agent_disconnected", ({ userId }) => {
      const uid = userId.toString();
      setAgents(prev =>
        prev.map(agent =>
          agent.user_id.toString() === uid
            ? { ...agent, statut_actuel: "Hors connexion", is_connected: false, depuis_sec: 0 }
            : agent
        )
      );
    });

    // Connexion
    socket.on("agent_connected", ({ userId }) => {
      const uid = userId.toString();
      setAgents(prev =>
        prev.map(agent =>
          agent.user_id.toString() === uid
            ? { ...agent, statut_actuel: "En ligne", is_connected: true, depuis_sec: 0 }
            : agent
        )
      );
    });

    // Changement de statut
    socket.on("agent_status_changed", ({ userId, newStatus }) => {
      const uid = userId.toString();
      setAgents(prev =>
        prev.map(agent =>
          agent.user_id.toString() === uid
            ? { ...agent, statut_actuel: newStatus, depuis_sec: 0 }
            : agent
        )
      );
    });

    // Déconnexion forcée côté agent
    socket.on("force_disconnect_by_admin", ({ userId, reason, forced }) => {
      const uid = userId.toString();
      console.log("[FRONT] 🔔 Event reçu : force_disconnect_by_admin", { userId, reason, forced });
      setAgents(prev =>
        prev.map(agent =>
          agent.user_id.toString() === uid
            ? { ...agent, statut_actuel: "Hors connexion", last_statut: "Hors connexion", is_connected: false, depuis_sec: 0 }
            : agent
        )
      );
    });

    // Session close forcée
    socket.on("session_closed_force", ({ userId }) => {
      const uid = userId.toString();
      setAgents(prev =>
        prev.map(agent =>
          agent.user_id.toString() === uid
            ? { ...agent, statut_actuel: "Hors connexion", last_statut: "Hors connexion", is_connected: false, depuis_sec: 0 }
            : agent
        )
      );
    });

    // Déconnexion forcée côté admin (pour update tableau live)
    socket.on("agent_disconnected_for_admin", ({ userId, newStatus }) => {
      const uid = userId.toString();
      setAgents(prev =>
        prev.map(agent =>
          agent.user_id.toString() === uid
            ? { ...agent, statut_actuel: newStatus, is_connected: false, depuis_sec: 0 }
            : agent
        )
      );
    });
  };

  // Si socket déjà connecté, on s'abonne immédiatement, sinon après le connect
  if (socket.connected) {
    subscribeSocketEvents();
  } else {
    socket.once("connect", subscribeSocketEvents);
    socket.connect();
  }

  // Désabonnement propre
  return () => {
    socket.off("agent_disconnected");
    socket.off("agent_connected");
    socket.off("agent_status_changed");
    socket.off("force_disconnect_by_admin");
    socket.off("session_closed_force");
    socket.off("agent_disconnected_for_admin");
  };
}, [user?.id, user?.role]);


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

  const handleExport = () => setShowExport(false);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Titre de section */}
      <h2 className="text-2xl font-bold mb-4"> Suivi en live des agents</h2>
      <div className="flex items-center mb-4">
        <SessionFilters
          q={q}
          setQ={setQ}
          sessionStatusFilter={sessionStatusFilter}
          setSessionStatusFilter={setSessionStatusFilter}
          onResetPage={() => { }}
        />
        
        <div className="flex-1" /> {/* Ceci pousse le bouton à droite */}
        {isAdmin && (
          <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
        >
          <Upload size={16} /> Exporter
        </button>)}
      </div>
      

      <SessionsTable
        sessions={filteredAgents}
        loading={loading}
        refresh={fetchAgents}
      />

      {showExport && (
        <ExportModal
          isOpen={showExport}
          agents={filteredAgents}
          onExport={handleExport}
          onClose={() => setShowExport(false)}
        />
      )}
      
      {isAdmin && (
        <AdminWorkTable />
      )}
    </div>
  );
}
