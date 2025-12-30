import React, { useState } from 'react';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import { AgentStatusProvider } from '../api/AgentStatusContext.jsx';
import { AuthContext } from './AuthContext.jsx';
import { useContext } from 'react';
import AdministrationUsers from '../components/componentsdesongletsAdmins/AdministrationUsers.jsx';
import axiosInstance from '../api/axiosInstance.js';
import { toast } from 'react-toastify';
import { statuses } from '../shared/StatusSelector.jsx';
import { useAgentStatus } from '../api/AgentStatusContext';
import { closeSession, startSession } from '../api/saveSessionToDB.js';
import AdminSettings from '../components/componentsdesongletsAdmins/AdminSettings.jsx';
import Footer from '../components/dashbords/Footer.jsx';
import { NotificationsProvider } from '../components/componentsAdminRH/NotificationsContext.jsx';
import SidebarSuperAdmin from '../components/sidebars/SidebarSuperAdmin.jsx';

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState(() => { return localStorage.getItem("activeSidebarItem") || "dashboard"; });
  const { logoutAgent, setCurrentStatus } = useAgentStatus();


  // États partagés
  const [etat, setEtat] = useState(null);
  const [timers, setTimers] = useState({});
  const [currentSession, setCurrentSession] = useState(null);


  /**
   * 🔄 Récupère les infos de session en cours depuis le backend
   * - Statut actuel
   * - Cumuls de temps par statut
   * - Heure de début de session
   */
  const refreshSessionData = async () => {
    if (!user?.id) return;
    try {
      const res = await axiosInstance.get(`/session_agents/user/live/${user.id}`);
      const data = res.data;
      if (!data) return;

      // 🔹 Conversion des temps cumulés en timers exploitables dans le front
      const newTimers = {};
      Object.entries(data.cumul_statuts || {}).forEach(([statusFr, sec]) => {
        const st = statuses.find(s => s.statusFr === statusFr);
        if (st?.key) newTimers[st.key] = sec;
      });
      setTimers(newTimers);

      // 🔹 Mise à jour de la session en cours si l’agent est "en ligne"
      if (data.statut_actuel && data.statut_actuel !== 'Hors ligne') {
        const start_time = data.session_start_time ? new Date(data.session_start_time) : null;
        setCurrentSession({
          status: data.statut_actuel,
          start_time,
          cumul_statuts: data.cumul_statuts
        });
        setEtat(data.statut_actuel);
        setCurrentStatus(data.statut_actuel); // synchro avec le contexte
      } else {
        // 🔹 Si pas de session en cours
        setCurrentSession(null);
        setEtat(null);
        setCurrentStatus(null);
      }
    } catch (err) {
      console.error("Erreur récupération cumul agent:", err.response?.data || err.message);
    }
  };

  /**
   * ⏱ useEffect pour :
   * - Charger les données de session dès que l’utilisateur est connu
   * - Lancer un intervalle pour incrémenter `tick` toutes les secondes
   *   (sert de "force refresh" pour recalculer les timers côté front)
   */

  // Timer qui incrémente elapsed en live depuis lastChange
  //   useEffect(() => {
  //     if (!etat || !lastChange || isNaN(new Date(lastChange).getTime())) {
  //       setElapsed(0);
  //       clearInterval(intervalRef.current);
  //       return;
  //     }

  //     const update = () => {
  //       const diff = Math.floor(
  //         (Date.now() - new Date(lastChange).getTime()) / 1000
  //       );
  //       setElapsed(diff >= 0 ? diff : 0);
  //     };

  //     update();
  //     intervalRef.current = setInterval(update, 1000);
  //     return () => clearInterval(intervalRef.current);
  //   }, [etat, lastChange, setElapsed]);

  //   useEffect(() => {
  //   try {
  //     const saved = localStorage.getItem("timers");
  //     if (saved) {
  //       const parsed = JSON.parse(saved);
  //       if (parsed) {
  //         if (parsed.etat) setEtat(parsed.etat);
  //         if (parsed.timers) setTimers(parsed.timers);
  //         if (parsed.lastChange) setLastChange(new Date(parsed.lastChange));
  //       }
  //     }
  //   } catch {

  //   }
  // }, []);

  /**
     * ⚡ Changement de statut (ex: Disponible → Pause → Hors ligne)
     * - Ferme la session courante
     * - Démarre une nouvelle session avec le nouveau statut
     * - Synchronise le contexte global (useAgentStatus)
     */
  const handleStatusChange = async (newEtatFr, pause) => {
    setCurrentStatus(newEtatFr); // synchro immédiate côté front
    if (!user?.id) return;
    try {
      await closeSession({ user_id: user.id }); // clôture de la session en DB
    } catch (_) { }

    try {
      await startSession({ user_id: user.id, status: newEtatFr, pause_type: pause }); // nouvelle session
      await refreshSessionData(); // reload données
    } catch (error) {
      console.error('Erreur démarrage session:', error);
      toast.error("Erreur démarrage session !");
    }
  };

  /**
   * 🚪 Déconnexion agent
   */
  const handleLogout = () => {
    logoutAgent();
  };
  
  return (
    <AgentStatusProvider>
      <NotificationsProvider>
      <div className="flex h-screen">
        <SidebarSuperAdmin activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader
            // key={tick}
            etat={etat}
            timers={timers}
            onStatusChange={handleStatusChange}
            currentAgent={user?.id}
            activePage={activeItem}
            currentSession={currentSession}
          />
          <main className="flex-1 p-6 bg-gray-100 overflow-auto">
            {activeItem === 'administration' && <AdministrationUsers />}
            {activeItem === 'settings' && <AdminSettings />}
          </main>
          <Footer />
        </div>
      </div>
      </NotificationsProvider>
    </AgentStatusProvider>
  );
};

export default SuperAdminDashboard;