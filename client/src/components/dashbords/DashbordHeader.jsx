import React, { useEffect, useState, useRef } from 'react';
import { Bell, CalendarDays, User } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SimpleTimer from './SimpleTimer'; // adapte le chemin

// dans ton render, à la place du TimerStatus :

const DashboardHeader = ({ activePage }) => {
  const [status, setStatus] = useState('indisponible');
  const [connectedAgent, setConnectedAgent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNotif, setShowNotif] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);

  const notifRef = useRef(null);
  const agentMenuRef = useRef(null);
  const calendarRef = useRef(null);

  // Chargement agent + status
  useEffect(() => {
    const storedAgent = localStorage.getItem('connectedAgent');
    const storedStatus = localStorage.getItem('status');
    if (storedAgent) setConnectedAgent(JSON.parse(storedAgent));
    if (storedStatus) setStatus(storedStatus);
  }, []);

  // Gestion click hors dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
      if (agentMenuRef.current && !agentMenuRef.current.contains(event.target)) {
        setShowAgentMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const pageTitles = {
    dashboard: 'Tableau de bord',
    files: 'Fichiers',
    sales: 'Ventes',
    appointments: 'Rendez-vous',
    support: 'Support',
    settings: 'Paramètres',
  };

  const displayTitle = pageTitles[activePage] || 'Page';

  return (
    <div className="flex items-center justify-between p-4 bg-white shadow rounded-lg sticky top-0 z-50">
      {/* Titre + Date */}
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-semibold">{displayTitle}</h1>
        <div
          onClick={() => calendarRef.current.setOpen(true)}
          className="flex items-center space-x-2 bg-blue-100 text-blue-600 px-3 py-1 rounded-lg cursor-pointer"
        >
          <CalendarDays size={18} />
          <DatePicker
            ref={calendarRef}
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            className="bg-transparent focus:outline-none cursor-pointer"
            dateFormat="dd/MM/yyyy"
            popperPlacement="bottom-start"
          />
        </div>
      </div>

      {/* Menu droit */}
      <div className="flex items-center space-x-6 relative">
        {/* Notifications */}
        <div ref={notifRef} className="relative cursor-pointer" onClick={() => setShowNotif(!showNotif)}>
          <Bell size={24} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          {showNotif && (
            <div className="absolute top-8 right-0 w-64 bg-white shadow-lg rounded-lg p-3 z-10">
              <p className="text-sm">❌ Vente <strong>#123456</strong> annulée.</p>
              <button
                onClick={() => (window.location.href = '/ventes')}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                Voir les détails
              </button>
            </div>
          )}
        </div>

        {/* Agent connecté */}
        <div ref={agentMenuRef} className="relative">
          <div
            className="flex items-center space-x-1 cursor-pointer"
            onClick={() => setShowAgentMenu(!showAgentMenu)}
          >
            <User size={22} className="text-gray-700" />
            <span className="text-sm font-medium text-gray-700">
              {connectedAgent ? `${connectedAgent.firstname} ${connectedAgent.lastname}` : '...'}
            </span>
          </div>
          {showAgentMenu && connectedAgent && (
            <div className="absolute top-8 right-0 w-56 bg-white shadow-lg rounded-lg p-4 z-10 text-sm">
              <p>
                <strong>Nom :</strong> {connectedAgent.firstname}
              </p>
              <p>
                <strong>Prénom :</strong> {connectedAgent.lastname}
              </p>
              <p>
                <strong>Profil :</strong> {connectedAgent.profil}
              </p>
            </div>
          )}
        </div>

        {/* Timer + Statuts */}
        <SimpleTimer />
      </div>
    </div>
  );
};

export default DashboardHeader;
