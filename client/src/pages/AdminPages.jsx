import React, { useState, useRef, useEffect } from 'react';
import SidebarAdmin from '../components/SidebarAdmin.jsx';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import { AgentStatusProvider } from '../api/AgentStatusContext.jsx';
import { AuthContext } from './AuthContext.jsx';
import { useContext } from 'react';
import useTimers from '../api/useTimers.js';
import AgentInfoPanel from '../components/componentsdesongletsAgents/AgentInfoPanel.jsx';
import AdministrationUsers from '../components/componentsdesongletsAdmins/AdministrationUsers.jsx';
import AdminSessionsUsers from '../components/componentsdesongletsAdmins/AdminSessionsUsers.jsx';
import socket from '../socket.js';
import useAgentFiches from '../api/useAgentFiches.js';
import axiosInstance from '../api/axiosInstance.js';
import VentesInfoPanel from '../components/componentsdesongletsAgents/VentesInfoPanel.jsx';
import AdminFichiersPanel from '../components/componentsdesongletsAdmins/AdminFichiersPanel.tsx';
import { toast } from 'react-toastify';
import { statuses } from '../shared/StatusSelector.jsx';
import { useAgentStatus } from '../api/AgentStatusContext';

const AdminDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState(() => {
      return localStorage.getItem("activeSidebarItem") || "dashboard";
    });
  const { sessionTime, pauseTime, dispoTime } = useAgentStatus();
  const timersData = useTimers();

  const fichesData = useAgentFiches(user);
  const intervalRef = useRef();

  // États partagés
  const [etat, setEtat] = useState("En ligne");
  const [timers, setTimers] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [lastChange, setLastChange] = useState(null);

    const [hasChosenStatusAfterReconnect, setHasChosenStatusAfterReconnect] = useState(() => {
    // Si on vient de se reconnecter (refresh), on force à false
    return localStorage.getItem('agent_has_chosen_status') === 'true';
    });

  const mapStatusToKey = (statusFr) => {
    const statusObj = statuses.find(s => s.statusFr === statusFr);
    return statusObj ? statusObj.key : null;
  };

  // Timer qui incrémente elapsed en live depuis lastChange
  useEffect(() => {
    if (!etat || !lastChange || isNaN(new Date(lastChange).getTime())) {
      setElapsed(0);
      clearInterval(intervalRef.current);
      return;
    }

    const update = () => {
      const diff = Math.floor(
        (Date.now() - new Date(lastChange).getTime()) / 1000
      );
      setElapsed(diff >= 0 ? diff : 0);
    };

    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [etat, lastChange, setElapsed]);

  useEffect(() => {
  try {
    const saved = localStorage.getItem("timers");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed) {
        if (parsed.etat) setEtat(parsed.etat);
        if (parsed.timers) setTimers(parsed.timers);
        if (parsed.lastChange) setLastChange(new Date(parsed.lastChange));
      }
    }
  } catch {

  }
}, []);

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

  // Gestion déconnexion
  const handleLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        // ⚡ Notifie le backend que l'agent se déconnecte
        await axiosInstance.post('/agent/disconnect', { 
          userId: user.id,
          timers: {
          sessionTime,
          pauseTime,
          dispoTime,
        },
      });
        socket.emit('agent_disconnected', { userId: user.id });
      }

      // Nettoyage local
      localStorage.clear();
      fichesData.loadFiches([]);
      setUser(null);

    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err.response?.data || err.message);
      toast.error("Impossible de se déconnecter correctement !");
    }
  };

  return (
    <AgentStatusProvider>
      <div className="flex h-screen">
        <SidebarAdmin activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />
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
            {activeItem === 'dashboard' && <p> tableau de bord de l'administrateur</p>}

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
              />}
            {activeItem === 'sales' && <VentesInfoPanel setActiveItem={setActiveItem} />}
            {activeItem === 'files' && <AdminFichiersPanel />}
            {activeItem === 'sessions' && <AdminSessionsUsers />}
            {activeItem === 'administration' && <AdministrationUsers />}
            {activeItem === 'settings' && <p> doit contenir les paramètres de l'administrateur</p>}
          </main>
        </div>
      </div>
    </AgentStatusProvider>
  );
};

export default AdminDashboard;