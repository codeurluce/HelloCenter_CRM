import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";
import SessionsTable from "../componentsAdminSessions/SessionsTable";
import SessionFilters from "../componentsAdminSessions/SessionFilters";
import ExportModal from "../componentsAdminSessions/ExportModal.jsx";
import { Download, RefreshCw } from "lucide-react";

export default function AdminSessionsUsers() {
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    startDate: null,
    endDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  // Charger les utilisateurs
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/users");
      setUsers(res.data);
      if (res.data.length > 0 && Object.keys(statuses).length === 0) {
        setFilteredUsers(res.data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
    }
  };

  // Charger le statut du jour pour chaque utilisateur
  const fetchStatuses = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const results = await Promise.all(
        users.map((user) =>
          axiosInstance
            .get(`/session_agents/user/${user.id}/status-today`)
            .then((res) => ({
              userId: user.id,
              status: res.data.status || "Inconnu",
              start_time: res.data.start_time || null,
              status_start_time: res.data.start_time || null,
              end_time: res.data.end_time || null,
              session_id: res.data.id || null,
            }))
            .catch(() => ({
              userId: user.id,
              status: "Inconnu",
              start_time: null,
              status_start_time: null,
              end_time: null,
              session_id: null,
            }))
        )
      );

      const statusMap = {};
      results.forEach(({ userId, status, start_time, status_start_time, end_time, session_id }) => {
        statusMap[userId] = { 
          status, 
          start_time, 
          status_start_time: start_time, // Utiliser start_time comme status_start_time
          end_time,
          session_id,
          lastUpdate: Date.now()
        };
      });
      setStatuses(statusMap);
    } catch (error) {
      console.error("Erreur lors de la récupération des statuts:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Démarrer/Arrêter le rafraîchissement automatique
  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (users.length > 0) {
        fetchStatuses(false); // Pas de loading spinner pour les mises à jour automatiques
      }
    }, 30000); // Refresh toutes les 30 secondes
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    fetchUsers();
    
    return () => {
      stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchStatuses();
    }
  }, [users]);

  useEffect(() => {
    if (autoRefresh && users.length > 0) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
    
    return () => stopAutoRefresh();
  }, [autoRefresh, users.length]);

  // Filtrage dynamique
  useEffect(() => {
    let filtered = [...users];
    const { search, status } = filters;

    if (search.trim()) {
      const searched = search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstname.toLowerCase().includes(searched) ||
          u.lastname.toLowerCase().includes(searched) ||
          u.email.toLowerCase().includes(searched)
      );
    }

    if (status) {
      filtered = filtered.filter((u) => {
        const userStatus = statuses[u.id]?.status;
        if (status === "dispo") return userStatus === "actif" || userStatus === "disponible";
        if (status === "pause") return userStatus === "pause";
        if (status === "indispo") return userStatus === "inactif" || userStatus === "indisponible";
        return userStatus === status;
      });
    }

    setFilteredUsers(filtered);
  }, [filters, users, statuses]);

  const usersWithStatus = filteredUsers.map((user) => ({
    ...user,
    status: statuses[user.id]?.status || "Inconnu",
    start_time: statuses[user.id]?.start_time || null,
    status_start_time: statuses[user.id]?.start_time || null,
    end_time: statuses[user.id]?.end_time || null,
    session_id: statuses[user.id]?.session_id || null,
    lastUpdate: statuses[user.id]?.lastUpdate || null,
  }));

  const handleManualRefresh = () => {
    fetchStatuses(true);
  };

  return (
    <div className="p-6 bg-white rounded-md shadow-md max-w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-blue-700">
          Statuts journaliers des agents
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-600">
              Mise à jour auto (30s)
            </label>
          </div>
          
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-grow max-w-7xl">
          <SessionFilters
            onApply={(newFilters) => setFilters(newFilters)}
            onReset={() =>
              setFilters({
                search: "",
                status: "",
                startDate: null,
                endDate: null,
              })
            }
          />
        </div>

        <div className="ml-auto">
          <button
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Indicateur de statut de connexion */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>Légende :</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Pause</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Indisponible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Inconnu</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span>Mise à jour {autoRefresh ? 'active' : 'inactive'}</span>
        </div>
      </div>

      <SessionsTable
        sessions={usersWithStatus}
        loading={loading}
        refresh={handleManualRefresh}
      />

      {exportOpen && (
        <ExportModal
          sessions={usersWithStatus}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}


// ------------------------------

import React, { useEffect, useState } from "react";
import { RefreshCw, Eye, RotateCcw, Power, Clock } from "lucide-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export default function SessionsTable({ sessions, loading, refresh }) {
  const [timers, setTimers] = useState({});
  const [presenceTotals, setPresenceTotals] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = {};
      const updatedPresence = {};
      const now = dayjs();

      sessions.forEach((s) => {
        const key = s.user_id || s.id;

        // Pour le timer du statut actuel, on utilise start_time de la session
        const statusStart = s.start_time ? dayjs(s.start_time) : null;
        const sessionStart = s.start_time ? dayjs(s.start_time) : null;
        const sessionEnd = s.end_time ? dayjs(s.end_time) : null;

        // Temps écoulé depuis le début du statut actuel (même que la session)
        if (statusStart && !sessionEnd) {
          // Session active - compteur en temps réel
          updatedTimers[key] = now.diff(statusStart, "second");
        } else if (statusStart && sessionEnd) {
          // Session terminée - temps figé
          updatedTimers[key] = sessionEnd.diff(statusStart, "second");
        } else {
          updatedTimers[key] = 0;
        }

        // Temps de présence total depuis start_time
        if (sessionStart && !sessionEnd) {
          // Session active
          updatedPresence[key] = now.diff(sessionStart, "second");
        } else if (sessionStart && sessionEnd) {
          // Session terminée
          updatedPresence[key] = sessionEnd.diff(sessionStart, "second");
        } else {
          updatedPresence[key] = 0;
        }
      });

      setTimers(updatedTimers);
      setPresenceTotals(updatedPresence);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessions]);

  const formatDuration = (sec) => {
    if (!sec || sec < 0) return "00:00:00";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase() || "";
    
    if (statusLower === "actif" || statusLower === "disponible" || statusLower === "dispo") {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (statusLower === "pause") {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (statusLower === "inactif" || statusLower === "indisponible" || statusLower === "indispo") {
      return "bg-red-100 text-red-800 border-red-200";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || "";
    
    if (statusLower === "actif" || statusLower === "disponible" || statusLower === "dispo") {
      return <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>;
    } else if (statusLower === "pause") {
      return <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>;
    } else if (statusLower === "inactif" || statusLower === "indisponible" || statusLower === "indispo") {
      return <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>;
    } else {
      return <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>;
    }
  };

  const isSessionActive = (session) => {
    return !session.end_time;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {sessions.length} agent{sessions.length > 1 ? 's' : ''} affiché{sessions.length > 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 py-2 px-4 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700">Agent</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700">Email</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700">Statut actuel</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                Temps dans le statut
              </div>
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700">Présence totale</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-blue-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && sessions.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-8 text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw size={20} className="animate-spin" />
                  Chargement des données...
                </div>
              </td>
            </tr>
          ) : sessions.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-8 text-gray-500 italic">
                Aucun agent trouvé
              </td>
            </tr>
          ) : (
            sessions.map((s) => {
              const key = s.user_id || s.id;
              const isActive = isSessionActive(s);
              
              return (
                <tr 
                  key={s.id} 
                  className={`border-t border-gray-200 hover:bg-blue-50 transition-colors ${
                    isActive ? 'bg-blue-25' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {s.firstname} {s.lastname}
                      </span>
                      {isActive && (
                        <span className="text-xs text-green-600 font-medium">
                          • En ligne
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 break-all text-sm">
                    {s.email}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(s.status)}
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(s.status)}`}
                      >
                        {s.status || "Inconnu"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm">
                      <span className={`${isActive ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>
                        {formatDuration(timers[key] || 0)}
                      </span>
                      {isActive && (
                        <div className="text-xs text-blue-500 mt-1">
                          En cours...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-700">
                    {formatDuration(presenceTotals[key] || 0)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors" 
                        title="Voir détail"
                      >
                        <Eye size={16} />
                      </button>
                      {isActive && (
                        <>
                          <button 
                            className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-lg transition-colors" 
                            title="Changer de statut"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button 
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors" 
                            title="Clôturer session"
                          >
                            <Power size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      
      {sessions.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
          Dernière mise à jour : {new Date().toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}