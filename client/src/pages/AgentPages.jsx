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
import  useTimers  from '../api/useTimers.js';
import  useAgentFiches  from '../api/useAgentFiches.js';

const AgentDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState('dashboard');

  const timersData = useTimers();
  const fichesData = useAgentFiches(user);

  const handleLogout = () => {
    localStorage.clear();
    fichesData.loadFiches([]);
    setUser(null);
    window.location.href = '/';
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
            {activeItem === 'files' && <FichesInfoPanel fiches={fichesData.fiches || [] } currentAgent={user?.id?.toString()} {...fichesData} />}
          </main>
        </div>
      </div>
    </AgentStatusProvider>
  );
};

export default AgentDashboard;