import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

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
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} onLogout={handleLogout} />

      <main className="flex-1 p-6 bg-gray-100 overflow-auto">
        <h1 className="text-xl font-bold mb-4">
          {pageTitles[activeItem] || 'Page'}
        </h1>

        {/* Tu peux ajouter des composants dynamiquement ici si besoin */}
        {activeItem === 'sales' && <p>Formulaire ou tableau de ventes...</p>}
        {activeItem === 'dashboard' && <p>Statistiques principales...</p>}
        {activeItem === 'appointments' && <p>Voir les rendez-vous programmés...</p>}
        {activeItem === 'support' && <p>demander de l'aide...</p>}
        {activeItem === 'files' && <p>voir les fiches injectés...</p>}
        {activeItem === 'settings' && <p>Paramètres de l'application...</p>}

      </main>
    </div>
  );
};

export default AgentDashboard;
