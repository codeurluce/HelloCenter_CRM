import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/dashbords/DashbordHeader';
import StatGroup from '../components/cards/StatGroup';

const AgentDashboard = () => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; // redirection vers login
  };

  // Mapping des titres par défaut selon les clés
  const pageTitles = {
    files: 'Fichiers',
    sales: 'Ventes',
    appointments: 'Rendez-vous',
    support: 'Support',
    settings: 'Setting'
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
            <p className="text-xl mb-4">Vue d'ensemble de votre activite</p>
              <StatGroup />
            </>
          )}

          {activeItem === 'sales' && <p>Formulaire ou tableau de ventes...</p>}
          {activeItem === 'appointments' && <p>Voir les rendez-vous programmés...</p>}
          {activeItem === 'support' && <p>Demander de l'aide...</p>}
          {activeItem === 'files' && <p>Voir les fiches injectées...</p>}
          {activeItem === 'settings' && <p>Paramètres de l'application...</p>}
        </main>
      </div>
    </div>
  );
};

export default AgentDashboard;
