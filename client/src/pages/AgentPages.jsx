import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const AgentDashboard = () => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; // redirection vers login
  };

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />
      
      <main className="flex-1 p-6 bg-gray-100 overflow-auto">
        {activeItem === 'dashboard' && <h1 className="text-xl font-bold">Tableau de bord</h1>}
        {activeItem === 'leaderboard' && <h1>Leaderboard</h1>}
        {activeItem === 'shipment' && <h1>Shipments</h1>}
        {/* Ajoute plus de composants ici selon le menu */}
      </main>
    </div>
  );
};

export default AgentDashboard;
