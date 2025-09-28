import React, { useState, useEffect, useRef, useContext } from 'react';
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
import socket from '../socket.js';
import { AuthContext } from './AuthContext.jsx';
import { AgentStatusProvider } from '../api/AgentStatusContext.jsx';
import { statuses } from '../shared/StatusSelector.jsx';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { closeSession } from '../api/saveSessionToDB.js';

const AgentDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeSidebarItem") || "dashboard";
  });
  const navigate = useNavigate();
  const intervalRef = useRef();
  const [loadingTimers, setLoadingTimers] = useState(true);

  // États partagés
  const [etat, setEtat] = useState(null); // ← null par défaut
  const [timers, setTimers] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [lastChange, setLastChange] = useState(null); // ← null = timer arrêté

  const mapStatusToKey = (statusFr) => {
    const statusObj = statuses.find(s => s.statusFr === statusFr);
    return statusObj ? statusObj.key : null;
  };

  // Fermer la session quand la page est quittée (refresh, fermeture, etc.)
useEffect(() => {
  const handleBeforeUnload = async () => {
    if (user?.id && etat) {
      try {
        await closeSession({ user_id: user.id });
        console.log("CloseOperation: Fermeture forcée au refresh");
      } catch (err) {
        // Ignore (ex: offline)
      }
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [user, etat]);

  // 🔁 Timer live (seulement si lastChange !== null)
  useEffect(() => {
      console.log("⏱️ TIMER MISE À JOUR - lastChange:", lastChange, "elapsed:", elapsed);
    if (lastChange === null) {
      setElapsed(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const update = () => {
      const diff = Math.floor((Date.now() - lastChange) / 1000);
          console.log("⏱️ TIMER INCREMENTE - diff:", diff); // ← LOG ICI
      setElapsed(diff >= 0 ? diff : 0);
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [lastChange]);

  // 📥 Chargement initial (login ou refresh)
  useEffect(() => {
    if (!user?.id) return;

    const fetchLiveSession = async () => {
      try {
        const res = await axiosInstance.get(`/session_agents/user/live/${user.id}`);
        const data = res.data;
        console.log("📥 Données reçues du backend:", data); // ← LOG ICI
        if (!data) return;

        // Charger les cumuls existants
        const newTimers = {};
        Object.entries(data.cumul_statuts || {}).forEach(([statusFr, sec]) => {
          const st = statuses.find(s => s.statusFr === statusFr);
          if (st?.key) newTimers[st.key] = sec;
        });

    console.log("🔄 Cumuls chargés:", newTimers);
    console.log("🔄 statut_actuel du backend:", data.statut_actuel);
    console.log("🔄 depuis_sec du backend:", data.depuis_sec);

        setTimers(newTimers);        // ⚠️ Ne PAS restaurer le statut actif → forcer à null
        setEtat(null);
        setElapsed(0);
        setLastChange(null); // ← timer arrêté
      } catch (err) {
        console.error("Erreur récupération cumul agent:", err.response?.data || err.message);
      } finally {
        setLoadingTimers(false);
      }
    };

    fetchLiveSession();
  }, [user]);

  // 🔄 Changement de statut (clic sur bouton)
  const handleStatusChange = (newEtatFr, pause) => {
 console.trace("CALLTYPE: handleStatusChange appelé avec", newEtatFr);
  // ... reste du code
    // 1. Si un statut était actif, cumuler le temps écoulé
    if (etat && lastChange !== null) {
      const duree = Math.floor((Date.now() - lastChange) / 1000);
      if (duree > 0) {
        const oldKey = mapStatusToKey(etat);
        if (oldKey) {
          setTimers(prev => ({
            ...prev,
            [oldKey]: (prev[oldKey] || 0) + duree
          }));
        }
      }
    }

    // 2. Démarrer un NOUVEAU timer pour le nouveau statut
    setEtat(newEtatFr);
    setLastChange(Date.now()); // ← timestamp de début
    setElapsed(0);
  };

  // --- Fiches (hors sujet, inchangé)
  const { fiches, loadFiches, onTreatFiche, onCancelFiche, onCloseFiche, onProgramRdv } = useFiches(user);
  const [loadingFiches, setLoadingFiches] = useState(false);

  const fetchFichesFromBackend = async () => {
    setLoadingFiches(true);
    try { await loadFiches(); }
    catch (error) { console.error('Erreur chargement fiches:', error); }
    finally { setLoadingFiches(false); }
  };

  useEffect(() => { if (user) fetchFichesFromBackend(); }, [user]);

  // --- Déconnexion
  const handleLogout = async () => {
    try {
      const userStored = JSON.parse(localStorage.getItem('user'));
      if (userStored) {
        await axiosInstance.post('/agent/disconnect', { userId: userStored.id });
        socket.emit('agent_disconnected', { userId: userStored.id });
      }
      localStorage.clear();
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      toast.error("Impossible de se déconnecter correctement !");
    }
  };

  return (
    <AgentStatusProvider>
      <div className="flex h-screen">
        <SidebarAgent activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {loadingTimers ? (
            <span>Chargement...</span>
          ) : (
            <DashboardHeader
              etat={etat}
              timers={timers}
              elapsed={elapsed}
              onStatusChange={handleStatusChange}
              currentAgent={user?.id}
              activePage={activeItem}
            />
          )}

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
    </AgentStatusProvider>
  );
};

export default AgentDashboard;