import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

export default function CorrectionModal({ isOpen, onClose, row, onSaved }) {

    function formatSecondsToHours(sec) {
        if (!sec || sec <= 0) return 0;
        return Number((sec / 3600).toFixed(2));
    }

    const initialStatuses = {
        Disponible: 0,
        'Pausette 1': 0,
        Déjeuner: 0,
        'Pausette 2': 0,
        Réunion: 0,
        Formation: 0,
        Brief: 0
    };

    const [statuses, setStatuses] = useState(initialStatuses);
    const [loading, setLoading] = useState(false);

    // ➤ Charger les données VRAIES de la DB
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

                // 👉 CONVERSION SECONDES → HEURES DÉCIMALES ICI
                setStatuses({
                    Disponible: formatSecondsToHours(cumul["Disponible"]),
                    "Pausette 1": formatSecondsToHours(cumul["Pausette 1"]),
                    Déjeuner: formatSecondsToHours(cumul["Déjeuner"]),
                    "Pausette 2": formatSecondsToHours(cumul["Pausette 2"]),
                    Réunion: formatSecondsToHours(cumul["Réunion"]),
                    Formation: formatSecondsToHours(cumul["Formation"]),
                    Brief: formatSecondsToHours(cumul["Brief"])
                });
            } catch (err) {
                console.error("Erreur fetch:", err);
                alert("Erreur lors du chargement des détails.");
            }
            setLoading(false);
        };

        fetchDetails();
    }, [isOpen, row]);

    if (!isOpen) return null;

    const handleChange = (status, value) => {
        setStatuses(prev => ({ ...prev, [status]: Number(value) }));
    };

    // 👉 tous les calculs se font en heures décimales
    const totals = {
        TotalPause: (statuses["Pausette 1"] || 0) + (statuses["Déjeuner"] || 0) + (statuses["Pausette 2"] || 0),
        TotalIndispo: (statuses["Réunion"] || 0) + (statuses["Formation"] || 0) + (statuses["Brief"] || 0),
    };
    totals.HeureTravail = (statuses["Disponible"] || 0) + totals.TotalIndispo;
    totals.PresenceTotale = totals.HeureTravail + totals.TotalPause;

    const handleSave = async () => {
        try {
            // reconversion heures → secondes pour sauvegarder
            const updatesInSeconds = {};
            Object.keys(statuses).forEach(key => {
                updatesInSeconds[key] = Math.round(statuses[key] * 3600);
            });

            await axiosInstance.patch("/session_agents/correct-session", {
                userId: row.user_id,
                sessionDate: dayjs(row.session_date).format("YYYY-MM-DD"),
                updates: updatesInSeconds
            });

            toast.success("Correction enregistrée avec succès !");
            onSaved();
            onClose();
        } catch (err) {
            console.error("Erreur correction:", err);
        //  Extraire le message du backend si disponible
        const message =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Erreur lors de la sauvegarde";

        toast.error(message);
    }
};

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">
                    Corriger les incohérences – {row.firstname} {row.lastname}
                </h2>

                {loading ? (
                    <p className="text-center py-4">Chargement…</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {Object.keys(statuses).map((status) => (
                                <div key={status}>
                                    <label className="block text-sm font-medium">{status}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={statuses[status]}
                                        onChange={(e) => handleChange(status, e.target.value)}
                                        className="border px-2 py-1 rounded w-full font-mono"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mb-4">
                            <p><strong>Total Pause:</strong> {totals.TotalPause} h</p>
                            <p><strong>Total Indisponibilités:</strong> {totals.TotalIndispo} h</p>
                            <p><strong>Heure de travail:</strong> {totals.HeureTravail} h</p>
                            <p><strong>Présence totale:</strong> {totals.PresenceTotale} h</p>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                    <button
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={handleSave}
                    >
                        Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    );
}