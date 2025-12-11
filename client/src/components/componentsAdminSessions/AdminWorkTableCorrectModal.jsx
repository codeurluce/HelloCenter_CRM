import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axiosInstance from "../../api/axiosInstance";

export default function AdminWorkTableCorrectModal({ isOpen, onClose, row, onSaved }) {
    const [travail, setTravail] = useState(0);
    const [pauses, setPauses] = useState(0);

    useEffect(() => {
        if (!row) return;
        setTravail(row.travail ? +(row.travail / 3600).toFixed(2) : 0);
        setPauses(row.pauses ? +(row.pauses / 3600).toFixed(2) : 0);
    }, [row]);

    if (!isOpen || !row) return null;

    const handleSave = async () => {
        // 🔹 1) Vérifier que les champs sont valides
        const travailNum = parseFloat(travail);
        const pausesNum = parseFloat(pauses);

        if (isNaN(travailNum) || isNaN(pausesNum)) {
            return Swal.fire("Erreur", "Veuillez saisir des valeurs numériques pour travail et pauses.", "error");
        }
        if (travailNum < 0 || pausesNum < 0) {
            return Swal.fire("Erreur", "Les valeurs ne peuvent pas être négatives.", "error");
        }

        const totalPresence = travailNum + pausesNum;

        // 🔹 2) Confirmation
        const result = await Swal.fire({
            icon: "question",
            title: "Confirmer la correction",
            html: `
            <p>Travail : ${travailNum} h</p>
            <p>Pauses : ${pausesNum} h</p>
            <p><strong>Présence totale : ${totalPresence} h</strong></p>
            <p>Voulez-vous vraiment enregistrer ces modifications ?</p>
        `,
            showCancelButton: true,
            confirmButtonText: "Oui, Corriger",
            cancelButtonText: "Annuler",
            confirmButtonColor: "#22c55e",
            cancelButtonColor: "#ef4444",
        });

        if (!result.isConfirmed) return;

        // 🔹 3) Envoi au backend
        try {
            await axiosInstance.patch(`/session_agents/correct-cumul/${row.cumul_id}`, {
                travail_sec: Math.round(travailNum * 3600),
                pauses_sec: Math.round(pausesNum * 3600),
                presence_sec: Math.round(totalPresence * 3600),
            });

            Swal.fire("Succès", "Les cumuls ont été corrigés.", "success");
            onSaved();
            onClose();
        } catch (err) {
            console.error(err);
            Swal.fire("Erreur", err?.response?.data?.message || "Erreur lors de la correction", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-96">
                <h3 className="text-lg font-bold mb-4">Corriger cumuls – {row.firstname} {row.lastname}</h3>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium">Travail (h)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={travail}
                            onChange={(e) => setTravail(parseFloat(e.target.value))}
                            className="border px-3 py-2 rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Pauses (h)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={pauses}
                            onChange={(e) => setPauses(parseFloat(e.target.value))}
                            className="border px-3 py-2 rounded w-full"
                        />
                    </div>

                    <div className="flex justify-between mt-2 font-semibold">
                        <span>Présence totale :</span>
                        <span>{(travail + pauses).toFixed(2)} h</span>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
}