import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/dashbords/DashbordHeader';
// import Profile from './Profile';
// import Vente from './Vente';

const AgentDashboard = () => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; // redirection vers login
  };

  // Mapping des titres par défaut selon les clés
  const pageTitles = {
    dashboard: 'Tableau de bord',
    files: 'Fichiers',
    sales: 'Ventes',
    appointments: 'Rendez-vous',
    support:'Support',
    settings: 'Setting'
    // ajoute d'autres clés ici selon ton app
  };

  return (
  <div className="flex h-screen">
    <Sidebar
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      onLogout={handleLogout}
    />

    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header toujours visible */}
      <DashboardHeader activePage={activeItem} />

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100 overflow-auto">
        {activeItem === 'sales' && <p>Formulaire ou tableau de ventes...</p>}
        {/* {activeItem === 'sales' && <Vente />} */}
        {activeItem === 'dashboard' && <p>Bienvenue sur le tableau de bord</p>}
        {activeItem === 'appointments' && <p>Voir les rendez-vous programmés...</p>}
        {activeItem === 'support' && <p>Demander de l'aide...</p>}
        {activeItem === 'files' && <p>Voir les fiches injectées...</p>}
        {activeItem === 'settings' && <p>Paramètres de l'application...</p>}
      </main>
    </div>
  </div>
);
}
export default AgentDashboard;
