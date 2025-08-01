import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import StatGroup from '../components/cards/StatGroup.js';
import WeeklySalesChart from '../components/cards/WeeklySalesChart.jsx';
import TodayRecap from '../components/cards/TodayRecap.jsx';
import AgentInfoPanel from '../components/componentsdesonglets/AgentInfoPanel.jsx';
import VentesInfoPanel from '../components/componentsdesonglets/VentesInfoPanel.jsx';
import FichesInfoPanel from '../components/componentsdesfiches/FichesInfoPanel.tsx';
import { AuthContext } from './AuthContext.jsx';
import {fetchFiches, handleTraitement, onCancelFiche, handleCloture, handleProgramRdv } from '../api/filesActions.js';

const AgentDashboard = () => {
  const [currentAgent, setCurrentAgent] = useState(null);
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [fiches, setFiches] = useState([]);

const loadFiches = async () => {
  if (!user?.id) return;
  const allFiches = await fetchFiches();
  const filtered = allFiches.filter((fiche) => fiche.agent_id?.toString() === user.id?.toString());
  setFiches(filtered);
  setCurrentAgent(user.id);
};

useEffect(() => {
  loadFiches();
}, [user]);


  // 🚪 Déconnexion
  const handleLogout = () => {
    localStorage.clear();
    setFiches([]);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        activeItem={activeItem}
        setActiveItem={setActiveItem}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader activePage={activeItem} />

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

          {activeItem === 'agents' && <AgentInfoPanel setActiveItem={setActiveItem} />}
          {activeItem === 'sales' && <VentesInfoPanel setActiveItem={setActiveItem} />}

          {activeItem === 'files' && (
            <FichesInfoPanel
              fiches={fiches}
  currentAgent={user?.univers || ''}
  onTreatFiche={(id) => handleTraitement(id, user.id, loadFiches)}
  onCloturer={(id, data) => handleCloture(id, data, loadFiches)}
  onProgramRdv={(id) => handleProgramRdv(id, loadFiches)}
  onCancelFiche={(id) => onCancelFiche(id, loadFiches)}
            />
          )}

          {activeItem === 'appointments' && <p>Voir les rendez-vous programmés...</p>}
          {activeItem === 'settings' && <p>Paramètres de l'application...</p>}
        </main>
      </div>
    </div>
  );
};

export default AgentDashboard;