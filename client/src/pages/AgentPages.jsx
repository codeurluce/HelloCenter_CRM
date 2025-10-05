// src/pages/AgentPages.jsx
import React, { useState, useEffect, useContext } from 'react';
import SidebarAgent from '../components/SidebarAgent.jsx';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import StatGroup from '../components/cards/StatGroup.js';
import WeeklySalesChart from '../components/cards/WeeklySalesChart.jsx';
import TodayRecap from '../components/cards/TodayRecap.jsx';
import AgentInfoPanel from '../components/componentsdesongletsAgents/AgentInfoPanel.jsx';
import VentesInfoPanel from '../components/componentsdesongletsAgents/VentesInfoPanel.jsx';
import FichesInfoPanel from '../components/componentsdesfiches/FichesInfoPanel.tsx';
import useFiches from '../api/useAgentFiches.js';
import axiosInstance from '../api/axiosInstance.js';
import { AuthContext } from './AuthContext.jsx';
import { useAgentStatus } from '../api/AgentStatusContext.jsx';
import { statuses } from '../shared/StatusSelector.jsx';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { closeSession, startSession } from '../api/saveSessionToDB.js';

const AgentDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState(localStorage.getItem("activeSidebarItem") || "dashboard");
  const navigate = useNavigate();
  const { logoutAgent, setCurrentStatus } = useAgentStatus();

  const [etat, setEtat] = useState(null);
  const [timers, setTimers] = useState({});
  const [currentSession, setCurrentSession] = useState(null);
  const [tick, setTick] = useState(0);

  const refreshSessionData = async () => {
    if (!user?.id) return;
    try {
      const res = await axiosInstance.get(`/session_agents/user/live/${user.id}`);
      const data = res.data;
      if (!data) return;

      const newTimers = {};
      Object.entries(data.cumul_statuts || {}).forEach(([statusFr, sec]) => {
        const st = statuses.find(s => s.statusFr === statusFr);
        if (st?.key) newTimers[st.key] = sec;
      });
      setTimers(newTimers);

      if (data.statut_actuel && data.statut_actuel !== 'Hors ligne') {
        const start_time = data.session_start_time ? new Date(data.session_start_time) : null;
        setCurrentSession({
          status: data.statut_actuel,
          start_time,
          cumul_statuts: data.cumul_statuts
        });
        setEtat(data.statut_actuel);
        setCurrentStatus(data.statut_actuel); // 🔑 Synchronisation du statut
      } else {
        setCurrentSession(null);
        setEtat(null);
        setCurrentStatus(null);
      }
    } catch (err) {
      console.error("Erreur récupération cumul agent:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (user?.id) refreshSessionData();
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleStatusChange = async (newEtatFr, pause) => {
    setCurrentStatus(newEtatFr); // 🔑 Synchronisation immédiate
    if (!user?.id) return;
    try {
      await closeSession({ user_id: user.id });
    } catch (_) {}

    try {
      await startSession({ user_id: user.id, status: newEtatFr, pause_type: pause });
      await refreshSessionData();
    } catch (error) {
      console.error('Erreur démarrage session:', error);
      toast.error("Erreur démarrage session !");
    }
  };

  const handleLogout = () => {
    logoutAgent();
  };

  const { fiches, loadFiches, onTreatFiche, onCancelFiche, onCloseFiche, onProgramRdv } = useFiches(user);
  const [loadingFiches, setLoadingFiches] = useState(false);

  const fetchFichesFromBackend = async () => {
    setLoadingFiches(true);
    try { await loadFiches(); }
    catch (error) { console.error('Erreur chargement fiches:', error); }
    finally { setLoadingFiches(false); }
  };

  useEffect(() => { if (user) fetchFichesFromBackend(); }, [user]);

  return (
    <div className="flex h-screen">
      <SidebarAgent activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          key={tick}
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
                <div className="flex-1"><WeeklySalesChart /></div>
                <TodayRecap />
              </div>
            </>
          )}
          {activeItem === 'activité' && (
            <AgentInfoPanel
              key={tick}
              userId={user?.id}
              etat={etat}
              setEtat={setEtat}
              timers={timers}
              onStatusChange={handleStatusChange}
              currentSession={currentSession}
            />
          )}
          {activeItem === 'sales' && <VentesInfoPanel setActiveItem={setActiveItem} />}
          {activeItem === 'files' && (
            <FichesInfoPanel
              fiches={fiches}
              currentAgent={user?.id?.toString()}
              loading={loadingFiches}
              onRefresh={fetchFichesFromBackend}
              onTreatFiche={onTreatFiche}
              onCancelFiche={onCancelFiche}
              onCloseFiche={onCloseFiche}
              onProgramRdv={onProgramRdv}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AgentDashboard;