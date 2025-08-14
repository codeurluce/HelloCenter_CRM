import React, { useState } from 'react';
import SidebarAdmin from '../components/SidebarAdmin.jsx';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import { AgentStatusProvider } from '../api/AgentStatusContext.jsx';
import { AuthContext } from './AuthContext.jsx';
import { useContext } from 'react';
import useTimers from '../api/useTimers.js';
import AgentInfoPanel from '../components/componentsdesonglets/AgentInfoPanel.jsx';



const AdminDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState('dashboard');
  const timersData = useTimers();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; // Redirection après déconnexion
  };

  return (
    <AgentStatusProvider>
      <div className="flex h-screen">
        <SidebarAdmin activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader {...timersData} currentAgent={user?.id} activePage={activeItem} />
          <main className="flex-1 p-6 bg-gray-100 overflow-auto">
            {activeItem === 'dashboard' && <p> tableau de bord de l'administrateur</p>             }
            {activeItem === 'activité' && <AgentInfoPanel {...timersData} userId={user?.id} />}
            {activeItem === 'sales' && <p> doit contenir les ventes de tous les agents </p>}
            {activeItem === 'files' && <p> doit contenir les fichiers des agnets</p>}
            {activeItem === 'sessions' && <p> doit contenir les sessions de tous les agents</p>}
            {activeItem === 'administration' && <p> doit contenir les paramètres d'administration</p>}
            {activeItem === 'settings' && <p> doit contenir les paramètres de l'administrateur</p>}
          </main>          
        </div>
      </div>
    </AgentStatusProvider>
  );
};

export default AdminDashboard;