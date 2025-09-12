import React, { useState, useEffect, useContext } from 'react';
import SidebarAgent from '../components/SidebarAgent.jsx';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import StatGroup from '../components/cards/StatGroup.js';
import WeeklySalesChart from '../components/cards/WeeklySalesChart.jsx';
import TodayRecap from '../components/cards/TodayRecap.jsx';
import AgentInfoPanel from '../components/componentsdesongletsAgents/AgentInfoPanel.jsx';
import VentesInfoPanel from '../components/componentsdesongletsAgents/VentesInfoPanel.jsx';
import FichesInfoPanel from '../components/componentsdesfiches/FichesInfoPanel.tsx';
import { AuthContext } from './AuthContext.jsx';
import { AgentStatusProvider } from '../api/AgentStatusContext.jsx';
import useTimers from '../api/useTimers.js';
import useFiches from '../api/useAgentFiches.js';
import axiosInstance from '../api/axiosInstance.js';
import socket from '../socket.js';

const AgentDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState('dashboard');
  const timersData = useTimers();

  // Utilisation du hook custom pour fiches
  const {
    fiches,
    loadFiches,
    onTreatFiche,
    onCancelFiche,
    onCloseFiche,
    onProgramRdv,
  } = useFiches(user);

  // État loading local pour la gestion UX
  const [loadingFiches, setLoadingFiches] = useState(false);

  // Fonction refresh qui utilise la méthode du hook + gère loading
  const fetchFichesFromBackend = async () => {
    setLoadingFiches(true);
    try {
      await loadFiches();
    } catch (error) {
      console.error('Erreur lors du chargement des fiches :', error);
    } finally {
      setLoadingFiches(false);
    }
  };

  // Chargement initial ou au changement d'utilisateur
  useEffect(() => {
    if (user) {
      fetchFichesFromBackend();
    }
  }, [user]);

  // Gestion déconnexion
  const handleLogout = async () => {
    try {
      const userStored = JSON.parse(localStorage.getItem('user'));
      if (userStored) {
        await axiosInstance.post('http://localhost:5000/api/agent/disconnect', { userId: userStored.id });
        socket.emit('agent_disconnected', { userId: userStored.id });
      }
      localStorage.clear();
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  return (
    <AgentStatusProvider>
      <div className="flex h-screen">
        <SidebarAgent activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader {...timersData} currentAgent={user?.id} activePage={activeItem} />
          <main className="flex-1 p-6 bg-gray-100 overflow-auto">
            {activeItem === 'dashboard' && (
              <>
                <StatGroup setActiveItem={setActiveItem} />
                <div className="mt-12 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <WeeklySalesChart />
                  </div>
                  <TodayRecap />
                </div>
              </>
            )}
            {activeItem === 'activité' && <AgentInfoPanel {...timersData} userId={user?.id} />}
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
    </AgentStatusProvider>
  );
};

export default AgentDashboard;