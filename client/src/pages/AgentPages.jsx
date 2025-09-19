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
import { statuses } from '../shared/StatusSelector.jsx';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AgentDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState('dashboard');
  const timersData = useTimers();
  const navigate = useNavigate();

    // États partagés
  const [etat, setEtat] = useState(null);
  const [timers, setTimers] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [lastChange, setLastChange] = useState(null);

  const mapStatusToKey = (statusFr) => {
  const statusObj = statuses.find(s => s.statusFr === statusFr);
  return statusObj ? statusObj.key : null;
};

  // Gestion du changement de statut - mise à jour cumulée des timers
  const handleStatusChange = (newEtatFr, pause) => {
    console.log('handleStatusChange dans AgentDashboard', newEtatFr, pause);

    let duree = 0;
    if (lastChange) {
      duree = Math.floor((Date.now() - new Date(lastChange).getTime()) / 1000);
      if (duree < 0) duree = 0;
    }

    const oldKey = etat ? mapStatusToKey(etat) : null;

    setTimers(prevTimers => {
      const newTimers = { ...prevTimers };
      if (oldKey) {
        newTimers[oldKey] = (newTimers[oldKey] || 0) + duree;
      }
      return newTimers;
    });

    setEtat(newEtatFr);
    setLastChange(new Date());
    setElapsed(0);
  };

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
        await axiosInstance.post('/agent/disconnect', { userId: userStored.id });
        socket.emit('agent_disconnected', { userId: userStored.id });
        socket.disconnect();
      }

      // Nettoyage local
      localStorage.clear();
      loadFiches([]); 
      setUser(null);

      // Redirection
      navigate("/login"); 
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err.response?.data || err.message);
      toast.error("Impossible de se déconnecter correctement !");
    }
  };

  return (
    <AgentStatusProvider>
      <div className="flex h-screen">
        <SidebarAgent activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader
            {...timersData}
            etat={etat}
            timers={timers}
            elapsed={elapsed}
            onStatusChange={handleStatusChange}
            currentAgent={user?.id}
            activePage={activeItem}
          />
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
            {activeItem === 'activité' && 
            <AgentInfoPanel
                {...timersData}
                userId={user?.id}
                etat={etat}
                setEtat={setEtat}
                timers={timers}
                setTimers={setTimers}
                elapsed={elapsed}
                setElapsed={setElapsed}
                lastChange={lastChange}
                setLastChange={setLastChange}
                onStatusChange={handleStatusChange}
              />
              }
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