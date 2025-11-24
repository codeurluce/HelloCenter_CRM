// src/componentsRH/AgentList.tsx
import React, { useEffect, useState } from "react";
import { RefreshCw, Eye, Pencil } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import UsersContratDetailsModal, { Agent } from "./UsersContratDetailsModal.tsx";
import UsersContratFormsModal from "./UsersContratFormsModal.tsx";


export default function AgentList() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
    const [editAgent, setEditAgent] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // 🔹 Charger les agents (users + contrat)
    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get("/rh/users-contrat");
            setAgents(res.data);
        } catch (err) {
            console.error("Erreur fetch agents:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    // 🔍 Filtrage recherche
    const filteredAgents = agents.filter((a) => {
        const search = searchTerm.toLowerCase();
        return (
            (a.lastname || "").toLowerCase().includes(search) ||
            (a.firstname || "").toLowerCase().includes(search) ||
            (a.contrat?.mail_perso || "").toLowerCase().includes(search) ||
            (a.contrat?.matricule || "").toLowerCase().includes(search) ||
            (a.contrat?.poste || "").toLowerCase().includes(search) ||
            (a.contrat?.type_contrat || "").toLowerCase().includes(search) ||
            (a.contrat?.age || "").toString().includes(search) ||
            (a.contrat?.genre_sexe || "").toLowerCase().includes(search) ||
            (a.contrat?.situation_matrimoniale || "").toLowerCase().includes(search) ||
            (a.contrat?.telephone || "").includes(search)
        );
    });

    return (
        <>
            <div className="relative pb-6">
                {/* Input texte */}
                <input
                    type="text"
                    placeholder="Rechercher par nom, email, téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                />
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
                {/* Bouton Rafraîchir */}
                <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                    <button
                        onClick={fetchAgents}
                        className="flex items-center gap-2 py-1 px-3 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition"
                    >
                        <RefreshCw size={16} /> Rafraîchir
                    </button>
                </div>

                <table className="w-full border-collapse">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Matricule</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Nom</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Prénom</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Poste</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Type de contrat</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Date debut contrat</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Date fin contrat</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold text-blue-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8}>
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <span className="text-blue-700 font-medium">Chargement des agents...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredAgents.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500 italic">Aucun agent trouvé</td>
                            </tr>
                        ) : (
                            filteredAgents.map((a) => (
                                <tr key={a.id} className="border-t border-gray-200 hover:bg-blue-50">
                                    <td className="px-6 py-3 text-gray-800">{a.contrat?.matricule || "-"}</td>
                                    <td className="px-6 py-3 text-gray-800">{a.lastname || "-"}</td>
                                    <td className="px-6 py-3 text-gray-800">{a.firstname || "-"}</td>
                                    <td className="px-6 py-3 text-gray-800">{a.contrat?.poste || "-"}</td>
                                    <td className="px-6 py-3 text-gray-800">{a.contrat?.type_contrat || "-"}</td>
                                    <td className="px-6 py-3 text-gray-800">{a.contrat?.date_debut_contrat ? new Date(a.contrat.date_debut_contrat).toLocaleDateString("fr-FR") : "-"}</td>
                                    <td className="px-6 py-3 text-gray-800">{a.contrat?.date_fin_contrat ? new Date(a.contrat.date_fin_contrat).toLocaleDateString("fr-FR") : "-"}</td>
                                    <td className="px-6 py-3 text-center flex justify-center gap-3">
                                        <button
                                            onClick={() => setSelectedAgent({
                                                ...a,
                                                ...a.contrat,
                                            })}
                                            className="px-3 py-1.5 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-transform transform hover:scale-105"
                                            title="Consulter"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => setEditAgent(a)}
                                            className="px-3 py-1.5 rounded-lg border border-green-100 text-green-600 hover:bg-green-600 hover:text-white transition-transform transform hover:scale-105"
                                            title="Mettre à jour"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {selectedAgent && (
                    <UsersContratDetailsModal
                        agent={selectedAgent}
                        onClose={() => setSelectedAgent(null)}
                        onEdit={(a) => {
                            setEditAgent(a);        // ouvre le modal de modification
                            setSelectedAgent(null);  // ferme le modal détails
                        }}
                    />
                )}

                {editAgent && (
                    <UsersContratFormsModal
                        agent={editAgent}
                        onClose={() => setEditAgent(null)} // 🔹 vide errors automatiquement
                        onUpdated={() => {
                            fetchAgents(); // 🔹 rafraichir la liste après update
                            setEditAgent(null);
                        }}
                    />
                )}
            </div>
        </>
    );
}
