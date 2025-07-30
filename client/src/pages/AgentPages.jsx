import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import DashboardHeader from '../components/dashbords/DashbordHeader.jsx';
import StatGroup from '../components/cards/StatGroup.js';
import WeeklySalesChart from '../components/cards/WeeklySalesChart.jsx';
import TodayRecap from '../components/cards/TodayRecap.jsx';
import AgentInfoPanel from '../components/componentsdesonglets/AgentInfoPanel.jsx';
import VentesInfoPanel from '../components/componentsdesonglets/VentesInfoPanel.jsx';
import FichesInfoPanel from '../components/componentsdesfiches/FichesInfoPanel.tsx';
import axios from 'axios';
import { AuthContext } from './AuthContext.jsx';

const AgentDashboard = () => {
  const [currentAgent, setCurrentAgent] = useState(null);
  const { user, setUser } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [fiches, setFiches] = useState([]);

  // 📦 Charger les fiches au chargement de l’agent
  const fetchFiches = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/files');
      const data = await response.json();
      setFiches(data);
    } catch (error) {
      console.error('Erreur lors du chargement des fiches :', error);
    }
  };

useEffect(() => {
  if (user?.id) {
    fetchFiches();
    setCurrentAgent(user.id); // ✅ met à jour l’agent connecté
  }
}, [user]);

  // 🚪 Déconnexion
  const handleLogout = () => {
    localStorage.clear();
    setFiches([]);
    setUser(null);
    window.location.href = '/';
  };

  // ⚙️ Prise en charge fiche
  const handleTraitement = async (ficheId) => {
    try {
      await axios.put(`http://localhost:5000/api/files/${ficheId}/traiter`, {
        statut: 'en_traitement',
        assignedTo: user.id,
        date_modification: new Date(),
      });
      fetchFiches();
    } catch (err) {
      console.error('Erreur lors de la prise en charge de la fiche :', err);
    }
  };

  // 🔄 Annuler la prise en charge
  const onCancelFiche = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/fiches/${id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'nouvelle', assignedTo: null }),
      });
      fetchFiches();
    } catch (error) {
      console.error("Erreur lors de l'annulation de la prise en charge :", error);
    }
  };

  // ✅ Clôturer fiche
  const handleCloture = async (ficheId, { tag, commentaire }) => {
    try {
      await axios.put(`http://localhost:5000/api/files/${ficheId}/cloturer`, {
        statut: 'cloturé',
        tag,
        commentaire,
        date_modification: new Date(),
      });
      fetchFiches();
    } catch (err) {
      console.error('Erreur lors de la clôture de la fiche :', err);
    }
  };

  // 📅 Programmer RDV
  const handleProgramRdv = async (ficheId) => {
    try {
      await axios.put(`http://localhost:5000/api/files/${ficheId}/rdv`, {
        statut: 'en_traitement',
        rendezVous: true,
      });
      fetchFiches();
    } catch (err) {
      console.error('Erreur lors de la programmation du RDV :', err);
    }
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
              onTreatFiche={handleTraitement}
              onCloturer={handleCloture}
              onProgramRdv={handleProgramRdv}
              onCancelFiche={onCancelFiche}
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
