// src/componentsRH/AgentList.tsx
import React, { useEffect, useState } from "react";
import { RefreshCw, Eye, Pause, LogOut, Search } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Swal from "sweetalert2";
import { toast } from "react-toastify";


// Formatage hh:mm:ss
const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return "00:00:00";
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
};

// Badge de statut cohérent avec SessionsTable
const getStatusBadge = (statut: string) => {
    if (!statut) return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">-</span>;
    if (statut === "Disponible") return <span className="bg-green-200 text-green-900 px-3 py-1 rounded-full text-xs font-semibold">{statut}</span>;
    if (statut.includes("Pause")) return <span className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold">{statut}</span>;
    if (["Formation", "Réunion", "Brief"].some(s => statut.includes(s))) return <span className="bg-red-200 text-red-900 px-3 py-1 rounded-full text-xs font-semibold">{statut}</span>;
    if (["Hors connexion", "Déconnecté"].includes(statut)) return <span className="bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">{statut}</span>;
    return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">{statut}</span>;
};

// Pause forcée
const handleForcePause = async (agentId: number, firstname: string, lastname: string) => {
    const result = await Swal.fire({
        title: `Mettre ${firstname} ${lastname} en pause ?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Oui",
        cancelButtonText: "Annuler",
        confirmButtonColor: "#ea580c",
    });
    if (!result.isConfirmed) return;
    try {
        await axiosInstance.post(`/agents/${agentId}/forcePause`);
        toast.success(`${firstname} ${lastname} est maintenant en pause.`);
    } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.error || "Impossible de mettre l'agent en pause");
    }
};

// Déconnexion forcée
const handleDisconnect = async (agentId: number, firstname: string, lastname: string) => {
    const result = await Swal.fire({
        title: `Déconnecter ${firstname} ${lastname} ?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Oui",
        cancelButtonText: "Annuler",
        confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
        await axiosInstance.post(`/agents/${agentId}/disconnectByAdmin`);
        toast.success(`${firstname} ${lastname} a été déconnecté.`);
    } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.error || "Impossible de déconnecter l'agent");
    }
};

export default function AgentList() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get("/agents");
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

    const filteredAgents = agents.filter(a =>
        a.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.telephone || "").includes(searchTerm)
    );

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
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Email</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Téléphone</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Date de naissance</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Sexe</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Age</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Situation matrimoniale</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Adresse</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Code Postal</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Num CNI Passeport</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Type de contrat</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Date de début contrat</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Date de fin contrat</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Date d'intégration</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Ancienneté</th>
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
                        ) : agents.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500 italic">Aucun agent trouvé</td>
                            </tr>
                        ) : (
                            agents.map((a) => (
                                <tr key={a.id} className="border-t border-gray-200 hover:bg-blue-50">
                                    <td className="px-6 py-3 text-gray-800">{a.nom}</td>
                                    <td className="px-6 py-3 text-gray-800">{a.prenom}</td>
                                    <td className="px-6 py-3 text-gray-800">{a.email}</td>
                                    <td className="px-6 py-3 text-gray-800">{a.telephone || "-"}</td>
                                    <td className="px-6 py-3">{getStatusBadge(a.statut)}</td>
                                    <td className="px-6 py-3 font-mono text-sm text-gray-700">{formatTime(a.depuis_sec || 0)}</td>
                                    <td className="px-6 py-3 font-mono text-sm text-gray-700">{formatTime(a.presence_totale_sec || 0)}</td>
                                    <td className="px-6 py-3 text-center flex justify-center gap-3">
                                        <button
                                            onClick={() => setSelectedAgent(a)}
                                            className="px-3 py-1.5 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-transform transform hover:scale-105"
                                            title="Consulter"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleForcePause(a.id, a.nom, a.prenom)}
                                            className="px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white transition-transform transform hover:scale-105"
                                            title="Mettre en pause"
                                        >
                                            <Pause className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDisconnect(a.id, a.nom, a.prenom)}
                                            className="px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-transform transform hover:scale-105"
                                            title="Déconnecter"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* {selectedAgent && (
        <AgentDetailsModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )} */}
            </div></>
    );
}
