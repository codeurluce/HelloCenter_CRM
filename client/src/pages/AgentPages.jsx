import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import StatGroup from '../components/cards/StatGroup.js';
import WeeklySalesChart from '../components/cards/WeeklySalesChart.jsx';
import TodayRecap from '../components/cards/TodayRecap.jsx';
import AgentInfoPanel from '../components/componentsdesonglets/AgentInfoPanel.jsx';
import VentesInfoPanel from '../components/componentsdesonglets/VentesInfoPanel.jsx';
import FichesInfoPanel from '../components/componentsdesfiches/FichesInfoPanel.tsx';
// import RendezVousPage from '../components/componentsdesonglets/RendezVousPage.jsx';
import { AuthContext } from './AuthContext.jsx';
import { fetchFiches, handleTraitement, onCancelFiche, handleCloture, handleProgramRdv } from '../api/filesActions.js';

const AgentDashboard = () => {
  const [currentAgent, setCurrentAgent] = useState(null);
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [fiches, setFiches] = useState([]);

  const loadFiches = async () => {
    if (!user?.id) return;
    const allFiches = await fetchFiches();
    console.log("📦 Fiches récupérées depuis fetchFiches :", allFiches);
    // const filtered = allFiches.filter((fiche) => fiche.assigned_to === user.id);
    setFiches(allFiches);
    console.log("📊 Fiches stockées dans le state :", allFiches);
    setCurrentAgent(user.id);
  };

  useEffect(() => {
    if (user?.id) {
    loadFiches();
  }
}, [user]);


  // 🚪 Déconnexion
  const handleLogout = () => {
    localStorage.clear();
    setFiches([]);
    setUser(null);
    window.location.href = '/';
  };


  const onCloseFiche = (id, data) => {  handleCloture(id, data, user, loadFiches);
};

const handleProgramRdvWrapper = (ficheId, rdvDate, commentaire) => {
  handleProgramRdv(ficheId, rdvDate, commentaire, loadFiches);
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
              currentAgent={user?.id?.toString() || ''}
              onTreatFiche={(id) => {handleTraitement(id, user, setFiches).then(() => {loadFiches(); }); }}
              onCloseFiche={onCloseFiche}
              onProgramRdv={handleProgramRdvWrapper}
              onCancelFiche={(id) => onCancelFiche(id, loadFiches)}
            />
          )}

          {/* {activeItem === 'appointments' && <RendezVousPage /> } */}
          {activeItem === 'settings' && <p>Paramètres de l'application...</p>}
        </main>
      </div>
    </div>
  );
};

export default AgentDashboard;