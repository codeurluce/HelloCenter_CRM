import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import SessionsTable from "../componentsAdminSessions/SessionsTable";
import SessionFilters from "../componentsAdminSessions/SessionFilters";
import ExportModal from "../componentsAdminSessions/ExportModal.jsx";
import { Download } from "lucide-react";

export default function AdminSessionsUsers() {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    startDate: null,
    endDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Charger tous les utilisateurs
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
    }
  };

  // Charger statuts et agrégats pour chaque utilisateur
  const fetchSessionsAndStatus = async () => {
    if (users.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        users.map(async (user) => {
          try {
            const res = await axiosInstance.get(`/session_agents/user/${user.id}/today-aggregates`);
            return {
              ...user,
              status: res.data.active?.status || "Inconnu",
              start_time: res.data.active?.start_time || null,
              presence_total: res.data.presence_total || 0,
              status_cumulative: res.data.totals?.[res.data.active?.status] || 0,
            };
          } catch {
            return {
              ...user,
              status: "Inconnu",
              start_time: null,
              presence_total: 0,
              status_cumulative: 0,
            };
          }
        })
      );
      setSessions(results);
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial des utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);

  // Dès que les utilisateurs sont chargés, récupérer leurs statuts et agrégats
  useEffect(() => {
    fetchSessionsAndStatus();
  }, [users]);

  // Appliquer recherche + filtre statut
  const filteredSessions = sessions.filter((user) => {
    const s = filters.search.toLowerCase();
    if (
      s &&
      ![user.firstname, user.lastname, user.email].some((field) =>
        field?.toLowerCase().includes(s)
      )
    ) {
      return false;
    }
    if (filters.status && user.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="p-6 bg-white rounded-md shadow-md max-w-full">
      <h2 className="text-3xl font-bold text-blue-700 mb-6">Statuts journaliers des agents</h2>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-grow max-w-7xl">
          <SessionFilters
            onApply={(newFilters) => setFilters(newFilters)}
            onReset={() =>
              setFilters({ search: "", status: "", startDate: null, endDate: null })
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

      <SessionsTable sessions={filteredSessions} loading={loading} refresh={fetchSessionsAndStatus} />

      {exportOpen && (
        <ExportModal sessions={filteredSessions} onClose={() => setExportOpen(false)} />
      )}
    </div>
  );
}
