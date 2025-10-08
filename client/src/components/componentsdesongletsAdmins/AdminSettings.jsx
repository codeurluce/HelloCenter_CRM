import React, { useEffect, useState, useContext } from "react";
import axiosInstance from "../../api/axiosInstance";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { Users, Trash2, RefreshCcw } from 'react-feather';
import { colorThemes } from '../../shared/colorThemes';
import { useTheme } from "../../shared/ThemeContext";

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

  const handleThemeChange = (newTheme) => {
  setSelectedTheme(newTheme);  // pour le select preview
  setTheme(newTheme);          // pour propager immédiatement au sidebar
};

  useEffect(() => {
    fetchAgents();
  }, [refreshFlag]);

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

  return (
    <div className="space-y-8">

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

          <div>
            <label className="block text-sm mb-2 text-gray-600 dark:text-gray-300">Aperçu</label>
            <div className={`rounded p-3 ${colorThemes[selectedTheme]} text-white font-medium`}>Sidebar preview</div>
          </div>
        </div>
      </section>

      {/* --- Section Gestion utilisateurs --- */}
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
                        <button
                          onClick={() => handleDelete(agent.id, false)}
                          className="px-3 py-1 rounded bg-yellow-100 text-yellow-800 text-sm"
                        >
                          Supprimer
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id, true)}
                          className="px-3 py-1 rounded bg-red-600 text-white text-sm flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Forcer
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

      <div className="text-sm text-gray-500 dark:text-gray-400">⚠️ Attention : la suppression forcée doit être réservée aux administrateurs avec privilèges élevés. Vérifie les droits côté backend avant d'activer cette option.</div>
    </div>
  );
}