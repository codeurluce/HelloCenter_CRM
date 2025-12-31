import React, { useEffect, useState, useContext } from "react";
import axiosInstance from "../../api/axiosInstance";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { Users, Trash2, RefreshCcw } from "react-feather";
import { colorThemes } from "../../shared/colorThemes";
import { useTheme } from "../../shared/ThemeContext";
import { is } from "date-fns/locale";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import useUsers from "../../api/useUsers";

// Composant de settings centralisés :
// - suppression forcée d'agents
// - choix du thème du sidebar (persisté dans localStorage)
// - switch mode clair / sombre (persisté dans localStorage)

export default function AdminSettings({ user }) {
  const [selectedTheme, setSelectedTheme] = useState(
    () => localStorage.getItem("sidebarTheme") || "blue"
  );
  const { theme, setTheme, darkMode, setDarkMode } = useTheme();
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [sites, setSites] = useState([]);
  const [siteMap, setSiteMap] = useState({});
  const [sitesLoading, setSitesLoading] = useState(true);
  const isAdmin = currentUser?.role === "Admin";
  const isSuperAdmin = currentUser?.role === "SuperAdmin";
  const isAdminOrSuperAdmin =
    currentUser?.role === "Admin" || currentUser?.role === "SuperAdmin";

  const {
    users: agents,
    loading,
    fetchUsers,
    toggleUserActive,
  } = useUsers({
    page: 1,
    limit: 1000,
    roleFilter: "",
    profilFilter: "",
    statusFilter: "",
    q: "",
    enabled: !!currentUser && isAdminOrSuperAdmin,
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axiosInstance.get("/users/me");
        setCurrentUser(res.data);
      } catch (err) {
        console.error(
          "Erreur récupération profil :",
          err.response?.data || err.message
        );
        toast.error("Impossible de charger votre profil");
      }
    };

    fetchCurrentUser();
  }, []);

  const handleThemeChange = (newTheme) => {
    setSelectedTheme(newTheme); // pour le select preview
    setTheme(newTheme); // pour propager immédiatement au sidebar
  };

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

  const handleDelete = async (agentId) => {
    const agent = agents.find((a) => a.id === agentId);

    const { isConfirmed } = await Swal.fire({
      title: `Supprimer ${
        agent?.firstname && agent?.lastname
          ? `${agent.firstname} ${agent.lastname}`
          : agent?.email || "cet agent"
      }`,
      text: "L'agent sera supprimé si aucune donnée liée n’existe, sinon il sera simplement désactivé.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#dc2626",
    });

    if (!isConfirmed) return;

    try {
      const res = await axiosInstance.delete(`/users/${agentId}/delete-users`);

      // Vérifie le message de retour pour ajuster le type de toast
      if (res.data.message?.toLowerCase().includes("désactivé")) {
        toast.info(res.data.message, {
          style: { whiteSpace: "pre-line" },
        });
      } else if (res.data.message?.toLowerCase().includes("supprimé")) {
        toast.success(res.data.message);
      } else {
        toast.success(res.data.message || "Suppression effectuée");
      }

      fetchUsers();
    } catch (err) {
      console.error(
        "Erreur suppression agent:",
        err.response?.data || err.message
      );
      toast.error(err.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  const fetchSites = async () => {
    setSitesLoading(true);
    try {
      const res = await axiosInstance.get("/sites"); // endpoint backend
      // Remplir l'état sites pour le tableau
      setSites(res.data);

      const map = {};
      const colors = ["blue", "green", "yellow", "purple"]; // juste un exemple
      res.data.forEach((s, i) => {
        const color = colors[i % colors.length];
        map[s.id] = {
          name: s.name,
          bg: `bg-${color}-100`,
          text: `text-${color}-800`,
          darkBg: `dark:bg-${color}-700`,
          darkText: `dark:text-${color}-100`,
        };
      });
      setSiteMap(map);
    } catch (err) {
      console.error("Erreur fetch sites:", err);
      toast.error("Impossible de charger les sites");
    } finally {
      setSitesLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSites();
    }
  }, [isSuperAdmin]);

  const handleAddSite = () => {
    Swal.fire({
      title: "Ajouter un site",
      html: `
      <input id="swal-code" class="swal2-input" placeholder="Code">
      <input id="swal-name" class="swal2-input" placeholder="Nom">
    `,
      confirmButtonText: "Ajouter",
      showCancelButton: true,
      preConfirm: () => {
        const code = document.getElementById("swal-code").value;
        const name = document.getElementById("swal-name").value;
        if (!code || !name) Swal.showValidationMessage("Code et nom requis");
        return { code, name };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosInstance.post("/sites", result.value);
          toast.success("Site ajouté");
          fetchSites();
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors de l'ajout du site");
        }
      }
    });
  };

  const handleEditSite = (site) => {
    Swal.fire({
      title: "Modifier le site",
      html: `
      <input id="swal-code" class="swal2-input" placeholder="Code" value="${site.code}">
      <input id="swal-name" class="swal2-input" placeholder="Nom" value="${site.name}">
    `,
      confirmButtonText: "Modifier",
      showCancelButton: true,
      preConfirm: () => {
        const code = document.getElementById("swal-code").value;
        const name = document.getElementById("swal-name").value;
        if (!code || !name) Swal.showValidationMessage("Code et nom requis");
        return { code, name };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosInstance.put(`/sites/${site.id}`, result.value);
          toast.success("Site modifié");
          fetchSites();
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors de la modification du site");
        }
      }
    });
  };

  const handleDeleteSite = (siteId) => {
    Swal.fire({
      title: "Supprimer ce site ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosInstance.delete(`/sites/${siteId}`);
          toast.success("Site supprimé");
          fetchSites();
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors de la suppression du site");
        }
      }
    });
  };

  if (!currentUser) return <p>Chargement du profil...</p>;

  return (
    <div className="space-y-8">
      {/* --- Section Profil utilisateur --- */}

      <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 transition-all duration-300">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.121 17.804A9 9 0 1118.364 4.561M12 7v5l3 3"
            />
          </svg>
          Mon profil
        </h2>

        {currentUser ? (
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar + nom complet */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-semibold shadow-md">
                {currentUser.firstname?.[0]}
                {currentUser.lastname?.[0]}
              </div>
              <h3 className="text-xl font-semibold mt-4 text-gray-900 dark:text-gray-100">
                {currentUser.firstname} {currentUser.lastname}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentUser.email}
              </p>
            </div>

            {/* Infos principales en 3 colonnes / 2 lignes */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
              {/* Ligne 1 */}
              <div>
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Nom
                </p>
                <p className="text-gray-800 dark:text-gray-100 font-medium">
                  {currentUser.lastname || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="text-gray-800 dark:text-gray-100 font-medium">
                  {currentUser.email}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Rôle
                </p>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 text-sm font-semibold shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {currentUser.role || "-"}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Site
                </p>
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
    bg-yellow-100 text-yellow-800 
    dark:bg-yellow-700/30 dark:text-yellow-300 
    text-sm font-semibold shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7h18M3 12h18M3 17h18"
                    />
                  </svg>
                  {currentUser.site_name || "-"}
                </span>
              </div>

              {/* Ligne 2 */}
              <div>
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Prénom
                </p>
                <p className="text-gray-800 dark:text-gray-100 font-medium">
                  {currentUser.firstname || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Date de création
                </p>
                <p className="text-gray-800 dark:text-gray-100 font-medium">
                  {new Date(currentUser.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Profil
                </p>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300 text-sm font-semibold shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.866-3.582 7-8 7a8 8 0 0116 0c-4.418 0-8-3.134-8-7z"
                    />
                  </svg>
                  {currentUser.profil || "-"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune information disponible
          </p>
        )}
      </section>

      {/* --- Section Apparence --- */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Apparence & thème
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-sm mb-2 text-gray-600 dark:text-gray-300">
              Couleur du sidebar
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-full rounded-lg p-2 border"
            >
              <option value="blue">Bleu</option>
              <option value="blueblack">Bleu & noir</option>
              {/* <option value="blackblue">noir bleu</option> */}
              <option value="green">Vert</option>
              <option value="gray">Sombre</option>
            </select>
            <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
              Le changement est enregistré et appliqué au rechargement.
            </p>
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
      {isAdminOrSuperAdmin && (
        <>
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Gestion des agents
              </h2>
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 p-2 rounded-lg shadow-inner">
                ⚠️ Attention : la suppression d'un compte doit être réservée aux
                administrateurs avec privilèges élevés.
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRefreshFlag((f) => f + 1)}
                  className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-white"
                  title="Rafraîchir"
                >
                  <RefreshCcw size={16} />
                </button>
                <button
                  onClick={() => fetchUsers()}
                  className="text-sm underline text-blue-600 dark:text-blue-400"
                >
                  Reload
                </button>
              </div>
            </div>

            {loading ? (
              <p>Chargement...</p>
            ) : (
              <div className="overflow-x-auto pt-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-sm text-gray-500 dark:text-gray-400">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Nom / Email</th>
                      <th className="pb-3">Rôle</th>
                      {isSuperAdmin && <th className="pb-3">Site</th>}
                      <th className="pb-3">Etat compte</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr
                        key={agent.id}
                        className="border-t border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-200">
                          {agent.id}
                        </td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-200">
                          {agent.name || agent.email}
                        </td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-200">
                          {agent.role || "-"}
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3 text-sm">
                            {siteMap[agent.site_id] ? (
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  siteMap[agent.site_id].bg
                                } ${siteMap[agent.site_id].text} ${
                                  siteMap[agent.site_id].darkBg
                                } ${siteMap[agent.site_id].darkText}`}
                              >
                                {siteMap[agent.site_id].name}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                                Inconnu
                              </span>
                            )}
                          </td>
                        )}
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-200">
                          <button
                            onClick={() => toggleUserActive(agent)}
                            className={`px-2 py-1 rounded text-xs ${
                              agent.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {agent.active ? "Actif" : "Inactif"}
                          </button>
                        </td>
                        <td className="py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="relative group">
                              <button
                                onClick={() => toggleUserActive(agent)}
                                aria-pressed={agent.active}
                                title=""
                                className={`px-3 py-1.5 rounded-lg border transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                                  agent.active
                                    ? "text-yellow-600 border-yellow-100 hover:bg-yellow-600 hover:text-white hover:scale-105"
                                    : "text-gray-600 border-gray-100 hover:bg-gray-600 hover:text-white hover:scale-105"
                                }`}
                              >
                                {agent.active ? (
                                  <LockKeyholeOpen className="w-4 h-4" />
                                ) : (
                                  <LockKeyhole className="w-4 h-4" />
                                )}
                              </button>

                              <span
                                className={`pointer-events-none absolute -top-9 right-0 hidden group-hover:block text-xs whitespace-nowrap px-2 py-1 rounded shadow-lg ${
                                  agent.active
                                    ? "bg-yellow-600 text-white"
                                    : "bg-gray-600 text-white"
                                }`}
                              >
                                {agent.active
                                  ? "Verrouiller le compte"
                                  : "Déverrouiller le compte"}
                              </span>
                            </div>
                            <div className="relative group">
                              <button
                                onClick={() => handleDelete(agent.id, false)}
                                title=""
                                className="px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-105"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-red-600 text-white text-xs whitespace-nowrap">
                                Supprimer le compte
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {agents.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Aucun agent trouvé.
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* --- Section Gestion des sites --- */}
      {isSuperAdmin && (
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Gestion des sites
            </h2>
            <button
              onClick={() => handleAddSite()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              + Ajouter un site
            </button>
          </div>

          {sitesLoading ? (
            <p>Chargement...</p>
          ) : (
            <div className="overflow-x-auto pt-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-500 dark:text-gray-400">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Nom</th>
                    <th className="pb-3">Créé le</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr
                      key={site.id}
                      className="border-t border-gray-100 dark:border-gray-700"
                    >
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-200">
                        {site.id}
                      </td>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-200">
                        {site.code}
                      </td>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-200">
                        {site.name}
                      </td>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-200">
                        {new Date(site.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditSite(site)}
                            className="px-3 py-1.5 rounded-lg border border-yellow-100 text-yellow-600 hover:bg-yellow-600 hover:text-white transition-transform transform hover:scale-105"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteSite(site.id)}
                            className="px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-transform transform hover:scale-105"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sites.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Aucun site trouvé.
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
