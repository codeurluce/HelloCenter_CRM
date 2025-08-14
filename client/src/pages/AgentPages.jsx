import React, { useState, useEffect, useContext } from 'react';
import SidebarAgent from '../components/SidebarAgent.jsx';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import StatGroup from '../components/cards/StatGroup.js';
import WeeklySalesChart from '../components/cards/WeeklySalesChart.jsx';
import TodayRecap from '../components/cards/TodayRecap.jsx';
import AgentInfoPanel from '../components/componentsdesonglets/AgentInfoPanel.jsx';
import VentesInfoPanel from '../components/componentsdesonglets/VentesInfoPanel.jsx';
import FichesInfoPanel from '../components/componentsdesfiches/FichesInfoPanel.tsx';
import { AuthContext } from './AuthContext.jsx';
import { fetchFiches, handleTraitement, onCancelFiche, handleCloture, handleProgramRdv } from '../api/filesActions.js';
import { AgentStatusProvider } from '../api/AgentStatusContext.jsx';

const initialTimersTemplate = {
  "Disponible": 0,
  "Pause Café": 0,
  "Pause Déjeuner": 0,
  "Formation": 0,
  "Autre Pause": 0,
  "Indisponible": 0,
};

// Fonction pour charger état depuis localStorage
const loadInitialTimers = () => {
  const raw = localStorage.getItem("timers");
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const lastChangeDate = data.lastChange ? new Date(data.lastChange) : null;
    if (lastChangeDate && isNaN(lastChangeDate.getTime())) return null;
    return {
      etat: data.etat || null,
      timers: { ...initialTimersTemplate, ...data.timers },
      lastChange: lastChangeDate,
    };
  } catch {
    return null;
  }
};

const AgentDashboard = () => {
  const { user, setUser } = useContext(AuthContext);

  // Init states avec données persistées si disponibles
  const initialData = loadInitialTimers();
  const [etat, setEtat] = useState(initialData?.etat || null);
  const [timers, setTimers] = useState(initialData?.timers || initialTimersTemplate);
  const [lastChange, setLastChange] = useState(initialData?.lastChange || null);
  const [elapsed, setElapsed] = useState(0);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [fiches, setFiches] = useState([]);
  const userId = JSON.parse(localStorage.getItem('user'))?.id;

  // Incrément elapsed chaque seconde pour l'état courant, calculé selon lastChange
  useEffect(() => {
    if (!etat || !lastChange || isNaN(new Date(lastChange).getTime())) {
      setElapsed(0);
      return;
    }
    const updateElapsed = () => {
      const diff = Math.floor((Date.now() - new Date(lastChange).getTime()) / 1000);
      setElapsed(diff >= 0 ? diff : 0);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [etat, lastChange]);

  // Sauvegarde dans localStorage à chaque changement important
  useEffect(() => {
    try {
      localStorage.setItem("timers", JSON.stringify({
        etat,
        timers,
        lastChange: lastChange ? lastChange.toISOString() : null,
      }));
    } catch {
      // ignore localStorage errors
    }
  }, [etat, timers, lastChange]);

  // Charge les fiches côté user connecté
  const loadFiches = async () => {
    if (!user?.id) return;
    const allFiches = await fetchFiches();
    setFiches(allFiches);
    setCurrentAgent(user.id);
  };

  useEffect(() => {
    if (user?.id) {
      loadFiches();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    setFiches([]);
    setUser(null);
    window.location.href = '/';
  };

  const onCloseFiche = (id, data) => {
    handleCloture(id, data, user, loadFiches);
  };
  const handleProgramRdvWrapper = (ficheId, rdvDate, commentaire) => {
    handleProgramRdv(ficheId, rdvDate, commentaire, loadFiches);
  };

  // La fonction de changement d'état qui cumule le temps dans états précédents avant changement
  const onStatusChange = (newEtat) => {
    if (etat && lastChange && !isNaN(new Date(lastChange).getTime())) {
      const duree = Math.floor((Date.now() - new Date(lastChange).getTime()) / 1000);
      if (timers[etat] !== undefined && duree > 0) {
        const updatedTimers = { ...timers };
        updatedTimers[etat] += duree;
        setTimers(updatedTimers);
      }
    }
    setEtat(newEtat);
    setLastChange(new Date());
    setElapsed(0);
  };

  return (
    <AgentStatusProvider>
      <div className="flex h-screen">
        <SidebarAgent activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader
            activePage={activeItem}
            etat={etat}
            timers={timers}
            elapsed={elapsed}
            onStatusChange={onStatusChange}
            currentAgent={currentAgent}
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

            {activeItem === 'activité' && (
              <AgentInfoPanel
              userId={userId} 
                setActiveItem={setActiveItem}
                etat={etat}
                setEtat={setEtat}
                timers={timers}
                setTimers={setTimers}
                lastChange={lastChange}
                setLastChange={setLastChange}
                elapsed={elapsed}
                setElapsed={setElapsed}
              />
            )}

            {activeItem === 'sales' && <VentesInfoPanel setActiveItem={setActiveItem} />}

            {activeItem === 'files' && (
              <FichesInfoPanel
                fiches={fiches}
                currentAgent={user?.id?.toString() || ''}
                onTreatFiche={(id) => handleTraitement(id, user, setFiches).then(loadFiches)}
                onCloseFiche={onCloseFiche}
                onProgramRdv={handleProgramRdvWrapper}
                onCancelFiche={(id) => onCancelFiche(id, loadFiches)}
              />
            )}

            {/* {activeItem === 'appointments' && <RendezVousPage />} */}
            {activeItem === 'settings' && <p>Paramètres de l'application...</p>}
          </main>
        </div>
      </div>
    </AgentStatusProvider>
  );
};

export default AgentDashboard;
