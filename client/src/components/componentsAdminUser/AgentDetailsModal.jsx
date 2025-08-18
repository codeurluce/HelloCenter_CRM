// src/components/admin/AgentDetailsModal.jsx
import React, { useEffect, useCallback } from "react";
import { X, Edit3, User } from "lucide-react";

const AgentDetailsModal = ({ agent, onClose, onEdit, onToggleStatus }) => {
    // Fermer avec la touche Echap
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const stopPropagation = useCallback((e) => e.stopPropagation(), []);

    if (!agent) return null;

    // Statut actif/désactivé
    const isActive = agent.is_active === 1 || agent.is_active === true;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}  >
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100" onClick={stopPropagation} >
                {/* Header */}
                <div className={`${isActive ? "bg-blue-600" : "bg-gray-600" } text-white flex items-center justify-between px-6 py-4`} >
                    <div className="flex items-center gap-2">
                        <User size={22} />
                        <h3 className="text-lg font-bold">
                            Détails de l’agent : {agent.firstname} {agent.lastname}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        aria-label="Fermer"
                        className="hover:bg-white/20 p-1 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Contenu */}
                <div className="p-6 space-y-4 overflow-y-auto text-gray-800">
                    <div className="grid grid-cols-2 gap-8">
                        {/* Colonne gauche */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-1">
                                Informations personnelles
                            </h3>
                            <Detail label="Prénom" value={agent.firstname || "-"} />
                            <Detail label="Nom" value={agent.lastname || "-"} />
                            <Detail label="Email" value={agent.email || "-"} />
                            <Detail label="Téléphone" value={agent.phone || "-"} />
                        </div>

                        {/* Colonne droite */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-1">
                                Informations Comptes
                            </h3>
                            <Detail label="Rôle" value={agent.role || "-"} />
                            <Detail
                                label="Statut"
                                value={
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${isActive ? "bg-green-600" : "bg-gray-600"
                                            }`}
                                    >
                                        {isActive ? "Actif" : "Désactivé"}
                                    </span>
                                }
                            />
                            <Detail
                                label="Créé le"
                                value={
                                    agent.created_at
                                        ? new Date(agent.created_at).toLocaleDateString("fr-FR")
                                        : "-"
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 bg-gray-100 px-6 py-4">
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg shadow-sm transition-colors"
                    >
                        <Edit3 size={18} />
                        Modifier
                    </button>

                    <button
                        onClick={() => onToggleStatus(agent)}
                        className={`flex items-center gap-2 ${isActive
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            } text-white font-medium px-5 py-2 rounded-lg shadow-sm transition-colors`}
                    >
                        {isActive ? "Désactiver" : "Activer"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Detail = ({ label, value }) => (
    <div className="flex items-center py-1 border-b border-gray-100">
        <span className="font-medium text-black-600 w-32">{label} :</span>
        <span className={value === "-" ? "text-gray-400 italic" : "text-gray-600"}>
            {value}
        </span>
    </div>
);

export default AgentDetailsModal;
