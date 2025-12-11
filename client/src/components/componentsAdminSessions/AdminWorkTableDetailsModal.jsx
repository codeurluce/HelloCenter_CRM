import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axiosInstance from "../../api/axiosInstance";
import { Clock, ClockPlus, CheckCircle2, LogOut } from "lucide-react";
import AdminWorkTableCorrectModal from "./AdminWorkTableCorrectModal";

export default function AdminWorkTableDetailsModal({ isOpen, onClose, row }) {
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [correctModalOpen, setCorrectModalOpen] = useState(false);

  const formatSecondsToHours = (sec) => {
    if (!sec || sec <= 0) return 0;
    return Number((sec / 3600).toFixed(2));
  };

  // --- Fonction d'aide pour convertir décimal → HHhMM ---
  const toHHMM = (decimal) => {
    if (!decimal || decimal <= 0) return "0h00";
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    return `${hours}h${minutes.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isOpen || !row) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const date = dayjs(row.session_date).format("YYYY-MM-DD");
        const res = await axiosInstance.get(
          `/session_agents/agent-session-details/${row.user_id}/${date}`
        );
        const cumul = res.data?.cumul_statuts || {};

        setStatuses({
          Disponible: formatSecondsToHours(cumul["Disponible"]),
          "Pausette 1": formatSecondsToHours(cumul["Pausette 1"]),
          Déjeuner: formatSecondsToHours(cumul["Déjeuner"]),
          "Pausette 2": formatSecondsToHours(cumul["Pausette 2"]),
          Réunion: formatSecondsToHours(cumul["Réunion"]),
          Formation: formatSecondsToHours(cumul["Formation"]),
          Brief: formatSecondsToHours(cumul["Brief"]),
        });
      } catch (err) {
        console.error("Erreur fetch:", err);
      }
      setLoading(false);
    };

    fetchDetails();
  }, [isOpen, row]);

  if (!isOpen) return null;

  const totals = {
    TotalPause:
      (statuses["Pausette 1"] || 0) +
      (statuses["Déjeuner"] || 0) +
      (statuses["Pausette 2"] || 0),
    TotalIndispo:
      (statuses["Réunion"] || 0) +
      (statuses["Formation"] || 0) +
      (statuses["Brief"] || 0),
  };

  totals.HeureTravail = (statuses["Disponible"] || 0) + totals.TotalIndispo;
  totals.PresenceTotale = totals.HeureTravail + totals.TotalPause;

  const statusConfig = [
    { key: "Disponible", icon: Clock, color: "text-green-600" },
    { key: "Pausette 1", icon: ClockPlus, color: "text-pink-600" },
    { key: "Pausette 2", icon: ClockPlus, color: "text-pink-600" },
    { key: "Déjeuner", icon: ClockPlus, color: "text-pink-700" },
    { key: "Réunion", icon: Clock, color: "text-blue-600" },
    { key: "Formation", icon: Clock, color: "text-purple-600" },
    { key: "Brief", icon: Clock, color: "text-orange-600" },
  ];

  const stopPropagation = (e) => e.stopPropagation();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/10 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl border border-gray-100 max-w-3xl w-full overflow-hidden"
          onClick={stopPropagation}
        >
          {/* HEADER */}
          <div className="bg-blue-600 text-white flex items-center justify-between px-6 py-4">
            <h3 className="text-lg font-bold">
              Détails de la session : {row.firstname} {row.lastname}
            </h3>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>

          {/* CONTENU */}
          <div className="p-6 space-y-6 overflow-y-auto text-gray-800 max-h-[70vh]">
            <div className="grid grid-cols-2 gap-8">

              {/* TOTAUX */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-1">
                  Totaux
                </h4>

                <div className="flex justify-between">
                  <span>Heure de travail :</span>
                  <span className="font-mono">{totals.HeureTravail} ({toHHMM(totals.HeureTravail)})</span>
                </div>

                <div className="flex justify-between">
                  <span>Total Pause :</span>
                  <span className="font-mono">{totals.TotalPause} ({toHHMM(totals.TotalPause)})</span>
                </div>

                <div className="flex justify-between">
                  <span>Total Indisponibilités :</span>
                  <span className="font-mono">{totals.TotalIndispo} ({toHHMM(totals.TotalIndispo)})</span>
                </div>

                <div className="flex justify-between">
                  <span>Présence totale :</span>
                  <span className="font-mono">{totals.PresenceTotale} ({toHHMM(totals.PresenceTotale)})</span>
                </div>
              </div>

              {/* TEMPS PAR STATUT */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-1">
                  Temps par statut
                </h4>

                {statusConfig.map(({ key, icon: Icon, color }, index) => {
                  const value = statuses[key] || 0;
                  if (value === 0) return null;

                  return (
                    <div
                      key={`${key}-${index}`}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={18} className={color} />
                        <span>{key}</span>
                      </div>
                      <span className="font-mono">{value} ({toHHMM(value)})</span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end bg-gray-100 px-6 py-4 gap-2">
            <button
              onClick={() => setCorrectModalOpen(true)} // 🔹 ouvre le modal de correction
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg shadow-sm transition-colors"
            >
              Corriger
            </button>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg shadow-sm transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 MODAL DE CORRECTION */}
      {correctModalOpen && (
        <AdminWorkTableCorrectModal
          isOpen={correctModalOpen}
          row={row}
          onClose={() => setCorrectModalOpen(false)}
          onSaved={() => setCorrectModalOpen(false)}
        />
      )}
    </>
  );
}