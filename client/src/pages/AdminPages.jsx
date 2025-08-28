import React, { useState } from 'react';
import SidebarAdmin from '../components/SidebarAdmin.jsx';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import { AgentStatusProvider } from '../api/AgentStatusContext.jsx';
import { AuthContext } from './AuthContext.jsx';
import { useContext } from 'react';
import useTimers from '../api/useTimers.js';
import AgentInfoPanel from '../components/componentsdesongletsAgents/AgentInfoPanel.jsx';
import AdministrationUsers from '../components/componentsdesongletsAdmins/AdministrationUsers.jsx';
import AdminSessionsUsers from '../components/componentsdesongletsAdmins/AdminSessionsUsers.jsx';
import socket  from '../socket.js';
import useAgentFiches from '../api/useAgentFiches.js';
import axiosInstance from '../api/axiosInstance.js';
import VentesInfoPanel from '../components/componentsdesongletsAgents/VentesInfoPanel.jsx';



const AdminDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState('dashboard');
  const timersData = useTimers();
  const fichesData = useAgentFiches(user);

  const handleLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        // ⚡ Notifie le backend que l'agent se déconnecte
        await axiosInstance.post('http://localhost:5000/api/agent/disconnect', { userId: user.id });
        socket.emit('agent_disconnected', { userId: user.id });
      }
      // Nettoyage local
      localStorage.clear();
      fichesData.loadFiches([]);
      setUser(null);
      // Redirection
      window.location.href = '/login'; 
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
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
            {activeItem === 'sales' && <VentesInfoPanel setActiveItem={setActiveItem} />}
            {activeItem === 'files' && <p> doit contenir les fichiers des agnets</p>}
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