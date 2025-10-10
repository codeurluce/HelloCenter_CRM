import React, { useEffect, useState, useContext } from "react";
import axiosInstance from "../../api/axiosInstance";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { Users, Trash2, RefreshCcw } from 'react-feather';
import { colorThemes } from '../../shared/colorThemes';
import { useTheme } from "../../shared/ThemeContext";
import { is } from "date-fns/locale";

// Composant de settings centralisés :
// - suppression forcée d'agents
// - choix du thème du sidebar (persisté dans localStorage)
// - switch mode clair / sombre (persisté dans localStorage)

export default function AdminSettings({ user }) {
    const [agents, setAgents] = useState([]);
    const [loadingAgents, setLoadingAgents] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem("sidebarTheme") || "blue");
    const { theme, setTheme, darkMode, setDarkMode } = useTheme();
    const [refreshFlag, setRefreshFlag] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const isAdmin = currentUser?.role === "Admin";

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const res = await axiosInstance.get("/users/me");
                setCurrentUser(res.data);
            } catch (err) {
                console.error("Erreur récupération profil :", err.response?.data || err.message);
                toast.error("Impossible de charger votre profil");
            }
        };

        fetchCurrentUser();
    }, []);

    const handleThemeChange = (newTheme) => {
        setSelectedTheme(newTheme);  // pour le select preview
        setTheme(newTheme);          // pour propager immédiatement au sidebar
    };

    useEffect(() => {
        if (currentUser && currentUser.role === "Admin") {
            fetchAgents();
        }
    }, [currentUser, refreshFlag]);

    useEffect(() => {
        // Appliquer le mode sombre immédiatement
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    useEffect(() => {
        // Persister le thème du sidebar
        localStorage.setItem("sidebarTheme", selectedTheme);
    }, [selectedTheme]);

    const fetchAgents = async () => {
        setLoadingAgents(true);
        try {
            const res = await axiosInstance.get("/users");
            setAgents(res.data || []);
        } catch (err) {
            console.error("Erreur chargement agents:", err.response?.data || err.message);
            toast.error("Impossible de charger la liste des agents");
        } finally {
            setLoadingAgents(false);
        }
    };

    const handleDelete = async (agentId, force = false) => {
        const agent = agents.find(a => a.id === agentId);
        const text = force
            ? "SUPPRESSION FORCÉE : toutes les données liées (sessions, fiches, ventes...) seront supprimées si présentes. Action irréversible."
            : "Désactiver ou supprimer cet agent ?";

        const { isConfirmed } = await Swal.fire({
            title: `Supprimer ${agent?.name || agent?.email || 'cet agent'}`,
            text,
            icon: force ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: force ? 'Supprimer définitivement' : 'Supprimer',
            confirmButtonColor: '#dc2626',
            cancelButtonText: 'Annuler',
        });

        if (!isConfirmed) return;

        try {
            await axiosInstance.delete(`/agents/${agentId}?force=${force}`);
            toast.success("Agent supprimé");
            setAgents(prev => prev.filter(a => a.id !== agentId));
        } catch (err) {
            console.error("Erreur suppression agent:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Erreur lors de la suppression");
        }
    };

    const handleDisconnect = async (agentId, agentName) => {
        // Afficher une confirmation
        const result = await Swal.fire({
            title: `Déconnecter ${agentName}?`,
            text: "Êtes-vous sûr de vouloir déconnecter cet agent ?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Oui, déconnecter",
            cancelButtonText: "Annuler",
            confirmButtonColor: "#dc2626",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return; // Si l'utilisateur annule, on sort

        // Sinon, on effectue la déconnexion
        try {
            await axiosInstance.post(`/agent/${agentId}/disconnectByAdmin`);
            toast.success("Agent déconnecté avec succès");
        } catch (err) {
            console.error("Erreur déconnexion agent :", err.response?.data || err.message);
            toast.error(err.response?.data?.error || "Impossible de déconnecter l'agent");
        }
    };

    const handleToggleActive = async (agentId, newActive) => {
        try {
            await axiosInstance.patch(`/agents/${agentId}`, { active: newActive });
            toast.success("Statut mis à jour");
            setAgents(prev => prev.map(a => a.id === agentId ? { ...a, active: newActive } : a));
        } catch (err) {
            console.error(err);
            toast.error("Impossible de mettre à jour le statut");
        }
    };

    if (!currentUser) return <p>Chargement du profil...</p>;

    return (
        <div className="space-y-8">

            {/* --- Section Profil utilisateur --- */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b pb-2">Mon profil</h2>

                {currentUser ? (
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">

                        {/* Bloc infos principales */}
                        <div className="flex-1 space-y-2">
                            <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold">Nom :</span> {currentUser.lastname || '-'}</p>
                            <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold">Prénom :</span> {currentUser.firstname || '-'}</p>
                            <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold">Email :</span> {currentUser.email}</p>
                            <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold">Compte créé le :</span> {new Date(currentUser.created_at).toLocaleDateString()}</p>
                        </div>

                        {/* Bloc rôle / profil */}
                        <div className="flex flex-col gap-2">
                            <p className="text-gray-700 dark:text-gray-200">Role :
                                <span className="ml-2 inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100 text-sm font-medium">
                                    {currentUser.role || '-'}
                                </span>
                            </p>
                            <p className="text-gray-700 dark:text-gray-200">Profil :
                                <span className="ml-2 inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100 text-sm font-medium">
                                    {currentUser.profil || '-'}
                                </span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aucune information disponible</p>
                )}
            </section>

            {/* <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 transition-all duration-300">
  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.364 4.561M12 7v5l3 3" />
    </svg>
    Mon profil
  </h2> */}

            {/* {currentUser ? ( */}
            {/* <div className="flex flex-col md:flex-row items-center md:items-start gap-8"> */}
            {/* Avatar + nom complet */}
            {/* <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-semibold shadow-md">
          {currentUser.firstname?.[0]}{currentUser.lastname?.[0]}
        </div>
        <h3 className="text-xl font-semibold mt-4 text-gray-900 dark:text-gray-100">
          {currentUser.firstname} {currentUser.lastname}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
      </div> */}

            {/* Infos principales en 3 colonnes / 2 lignes */}
            {/* <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner"> */}
            {/* Ligne 1 */}
            {/* <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Nom</p>
          <p className="text-gray-800 dark:text-gray-100 font-medium">{currentUser.lastname || '-'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Email</p>
          <p className="text-gray-800 dark:text-gray-100 font-medium">{currentUser.email}</p>
        </div>  
        <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Rôle</p>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 text-sm font-semibold shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {currentUser.role || '-'}
          </span>
        </div> */}

            {/* Ligne 2 */}
            {/* <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Prénom</p>
          <p className="text-gray-800 dark:text-gray-100 font-medium">{currentUser.firstname || '-'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Date de création</p>
          <p className="text-gray-800 dark:text-gray-100 font-medium">
            {new Date(currentUser.created_at).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Profil</p>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300 text-sm font-semibold shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.866-3.582 7-8 7a8 8 0 0116 0c-4.418 0-8-3.134-8-7z" />
            </svg> */}
            {/* {currentUser.profil || '-'} */}
            {/* </span>
        </div>
      </div>
    </div>
  ) : (
    <p className="text-sm text-gray-500 dark:text-gray-400">Aucune information disponible</p>
  )}
</section> */}

            {/* --- Section Apparence --- */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Apparence & thème</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                        <label className="block text-sm mb-2 text-gray-600 dark:text-gray-300">Couleur du sidebar</label>
                        <select
                            value={selectedTheme}
                            onChange={e => handleThemeChange(e.target.value)}
                            className="w-full rounded-lg p-2 border"
                        >
                            <option value="blue">Bleu</option>
                            <option value="blueblack">Bleu & noir</option>
                            {/* <option value="blackblue">noir bleu</option> */}
                            <option value="green">Vert</option>
                            <option value="gray">Sombre</option>
                        </select>
                        <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">Le changement est enregistré et appliqué au rechargement ou si votre sidebar lit la préférence depuis localStorage.</p>
                    </div>

                    {/* <div>
            <label className="block text-sm mb-2 text-gray-600 dark:text-gray-300">Mode</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(false)}
                className={`px-3 py-2 rounded ${!darkMode ? 'bg-gray-200' : 'bg-transparent'} `}
              >
                ☀️ Clair
              </button>
              <button
                onClick={() => setDarkMode(true)}
                className={`px-3 py-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-transparent'}`}
              >
                🌙 Sombre
              </button>
            </div>
            <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">Mode enregistré dans localStorage (clé: <code>theme</code>).</p>
          </div> */}

                    {/* <div>
            <label className="block text-sm mb-2 text-gray-600 dark:text-gray-300">Aperçu</label>
            <div className={`rounded p-3 ${colorThemes[selectedTheme]} text-white font-medium`}>Sidebar preview</div>
          </div> */}
                </div>
            </section>

            {/* --- Section Gestion utilisateurs --- */}
            {isAdmin && (
                <>
                    <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Gestion des agents</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setRefreshFlag(f => f + 1)}
                                    className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-white"
                                    title="Rafraîchir"
                                >
                                    <RefreshCcw size={16} />
                                </button>
                                <button
                                    onClick={() => fetchAgents()}
                                    className="text-sm underline text-blue-600 dark:text-blue-400"
                                >
                                    Reload
                                </button>
                            </div>
                        </div>

                        {loadingAgents ? (
                            <p>Chargement...</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-sm text-gray-500 dark:text-gray-400">
                                            <th className="pb-3">ID</th>
                                            <th className="pb-3">Nom / Email</th>
                                            <th className="pb-3">Rôle</th>
                                            <th className="pb-3">Actif</th>
                                            <th className="pb-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {agents.map(agent => (
                                            <tr key={agent.id} className="border-t border-gray-100 dark:border-gray-700">
                                                <td className="py-3 text-sm text-gray-700 dark:text-gray-200">{agent.id}</td>
                                                <td className="py-3 text-sm text-gray-700 dark:text-gray-200">{agent.name || agent.email}</td>
                                                <td className="py-3 text-sm text-gray-700 dark:text-gray-200">{agent.role || '-'}</td>
                                                <td className="py-3 text-sm text-gray-700 dark:text-gray-200">
                                                    <button
                                                        onClick={() => handleToggleActive(agent.id, !agent.active)}
                                                        className={`px-2 py-1 rounded text-xs ${agent.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                                    >
                                                        {agent.active ? 'Actif' : 'Inactif'}
                                                    </button>
                                                </td>
                                                <td className="py-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {/* <button
                                                            onClick={() => handleDelete(agent.id, false)}
                                                            className="px-3 py-1 rounded bg-yellow-100 text-yellow-800 text-sm"
                                                        >
                                                            Supprimer
                                                        </button> */}
                                                        <button
                                                            onClick={() => handleDelete(agent.id, true)}
                                                            className="px-3 py-1 rounded bg-red-600 text-white text-sm flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} /> Forcer
                                                        </button>
                                                        <button
                                                            onClick={() => handleDisconnect(agent.id)}
                                                            className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                                                        >
                                                            Déconnexion
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {agents.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Aucun agent trouvé.</p>}
                            </div>
                        )}
                    </section>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        ⚠️ Attention : la suppression forcée doit être réservée aux administrateurs avec privilèges élevés.
                    </div>
                </>
            )}
        </div>
    );
}