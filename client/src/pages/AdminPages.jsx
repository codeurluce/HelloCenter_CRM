import React, { useState, useRef, useEffect } from 'react';
import SidebarAdmin from '../components/sidebars/SidebarAdmin.jsx';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import StatGroup from '../components/cards/StatGroup.js';
import WeeklySalesChart from '../components/cards/WeeklySalesChart.jsx';
import { AgentStatusProvider } from '../api/AgentStatusContext.jsx';
import { AuthContext } from './AuthContext.jsx';
import { useContext } from 'react';
import useTimers from '../api/useTimers.js';
import AgentInfoPanel from '../components/componentsdesongletsAgents/AgentInfoPanel.jsx';
import AdministrationUsers from '../components/componentsdesongletsAdmins/AdministrationUsers.jsx';
import AdminSessionsUsers from '../components/componentsdesongletsAdmins/AdminSessionsUsers.jsx';
import useAgentFiches from '../api/useAgentFiches.js';
import axiosInstance from '../api/axiosInstance.js';
import VentesInfoPanel from '../components/componentsdesongletsAgents/VentesInfoPanel.jsx';
import AdminFichiersPanel from '../components/componentsdesongletsAdmins/AdminFichiersPanel.tsx';
import { toast } from 'react-toastify';
import { statuses } from '../shared/StatusSelector.jsx';
import { useAgentStatus } from '../api/AgentStatusContext';
import { closeSession, startSession } from '../api/saveSessionToDB.js';
import WeeklySalesChartAdmin from '../components/cards/WeeklySalesChartAdmin.jsx';
import MonthlySalesChart from '../components/cards/MonthlySalesChart.jsx';
import MonthlySalesChartAdmin from '../components/cards/MonthlySalesChartAdmin.jsx';
import MonthlyAgentSalesPieChart from '../components/cards/MonthlyAgentSalesPieChart.jsx';
import AdminSettings from '../components/componentsdesongletsAdmins/AdminSettings.jsx';
import Footer from '../components/dashbords/Footer.jsx';
import RHPanel from '../components/componentsdesongletsAdmins/RHPanel.tsx';
import NotificationsFinContrat from '../components/componentsAdminRH/NotificationsFinContrat.jsx';

const AdminDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState(() => { return localStorage.getItem("activeSidebarItem") || "dashboard"; });
  const { logoutAgent, setCurrentStatus } = useAgentStatus();

  const { sessionTime, pauseTime, dispoTime } = useAgentStatus();
  const timersData = useTimers();

  const fichesData = useAgentFiches(user);
  const intervalRef = useRef();

  // États partagés
  const [etat, setEtat] = useState(null);
  const [timers, setTimers] = useState({});
  const [currentSession, setCurrentSession] = useState(null);
  const [tick, setTick] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [lastChange, setLastChange] = useState(null);
  // const [hasChosenStatusAfterReconnect, setHasChosenStatusAfterReconnect] = useState(() => { return localStorage.getItem('agent_has_chosen_status') === 'true'; });

  const mapStatusToKey = (statusFr) => {
    const statusObj = statuses.find(s => s.statusFr === statusFr);
    return statusObj ? statusObj.key : null;
  };

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
useEffect(() => {
  if (user?.id) refreshSessionData();
}, [user]);

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

  // Gestion déconnexion
  // const handleLogout = async () => {
  //   try {
  //     const user = JSON.parse(localStorage.getItem('user'));
  //     if (user) {
  //       // ⚡ Notifie le backend que l'agent se déconnecte
  //       await axiosInstance.post('/agent/disconnect', { 
  //         userId: user.id,
  //         timers: {
  //         sessionTime,
  //         pauseTime,
  //         dispoTime,
  //       },
  //     });
  //       socket.emit('agent_disconnected', { userId: user.id });
  //     }

  //     // Nettoyage local
  //     localStorage.clear();
  //     fichesData.loadFiches([]);
  //     setUser(null);

  //   } catch (err) {
  //     console.error('Erreur lors de la déconnexion:', err.response?.data || err.message);
  //     toast.error("Impossible de se déconnecter correctement !");
  //   }
  // };

  return (
    <AgentStatusProvider>
      <div className="flex h-screen">
        <SidebarAdmin activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />
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
            {activeItem === 'dashboard' && (
              <>
                <StatGroup setActiveItem={setActiveItem} />
                <div className="mt-12 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <WeeklySalesChart />
                  </div>
                  <div className="flex-1">
                    <WeeklySalesChartAdmin />
                  </div>

                </div>
                <div className="mt-12 flex flex-col md:flex-row gap-6 mb-14">
                  <div className="flex-1">
                    <MonthlySalesChart />
                  </div>
                  <div className="flex-1">
                    <MonthlySalesChartAdmin />
                  </div>
                </div>
                {/* <div className="flex-1">
                  <MonthlyAgentSalesPieChart />
                </div> */}
              </>
            )}

            {activeItem === 'activité' &&
              <AgentInfoPanel
                // key={tick}
                userId={user?.id}
                etat={etat}
                setEtat={setEtat}
                timers={timers}
                setTimers={setTimers}
                onStatusChange={handleStatusChange}
                currentSession={currentSession}

              />}
            {activeItem === 'sales' && <VentesInfoPanel setActiveItem={setActiveItem} />}
            {activeItem === 'files' && <AdminFichiersPanel />}
            {activeItem === 'sessions' && <AdminSessionsUsers />}
            {activeItem === 'rh' && <RHPanel />}
            {activeItem === 'comptable' && <p></p>} 
            {activeItem === 'administration' && <AdministrationUsers />}
            {activeItem === 'settings' && <AdminSettings />}
          </main>
          <Footer />
        </div>
      </div>
    </AgentStatusProvider>
  );
};

export default AdminDashboard;