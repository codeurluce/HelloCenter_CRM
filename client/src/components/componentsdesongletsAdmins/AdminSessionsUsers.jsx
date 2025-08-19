import React, { useState, useEffect } from 'react';
import SessionsTable from '../componentsAdminSessions/SessionsTable';
import SessionFilters from '../componentsAdminSessions/SessionFilters';
import ExportModal from '../componentsAdminSessions/ExportModal.jsx';
import axiosInstance from '../../api/axiosInstance';
import { Download } from 'lucide-react';

export default function AdminSessionsUsers() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: null,
    endDate: null,
  });

  const [exportOpen, setExportOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/sessions');
      setSessions(res.data);
      setFilteredSessions(res.data);
    } catch (error) {
      console.error('Erreur fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = [...sessions];
    const { search, status, startDate, endDate } = filters;

    if (search.trim()) {
      const searched = search.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.user.firstname.toLowerCase().includes(searched) ||
          s.user.lastname.toLowerCase().includes(searched) ||
          s.user.email.toLowerCase().includes(searched)
      );
    }
    if (status) {
      filtered = filtered.filter((s) => s.status === status);
    }
    if (startDate) {
      filtered = filtered.filter((s) => new Date(s.start_time) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((s) => new Date(s.start_time) <= endDate);
    }
    setFilteredSessions(filtered);
  }, [filters, sessions]);

  return (
    <div className="p-6 bg-white rounded-md shadow-md max-w-full">
      <h2 className="text-3xl font-bold text-blue-700 mb-6">Sessions des agents</h2>

      {/* Container avec SessionFilters à gauche et Exporter à droite */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-grow max-w-7xl">
          <SessionFilters
            onApply={(newFilters) => setFilters(newFilters)}
            onReset={() =>
              setFilters({
                search: '',
                status: '',
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

      <SessionsTable sessions={filteredSessions} loading={loading} refresh={fetchSessions} />

      {exportOpen && (
        <ExportModal sessions={filteredSessions} onClose={() => setExportOpen(false)} />
      )}
    </div>
  );
}