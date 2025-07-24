import React, { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, User } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DashboardHeader = ({ agentName = 'Agent Alpha' , activePage}) => {
  const [status, setStatus] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [pauseTime, setPauseTime] = useState(0);
  const [workTime, setWorkTime] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNotif, setShowNotif] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const notifRef = useRef(null);
  const agentMenuRef = useRef(null);
  const calendarRef = useRef(null);





  // Fermer les popups si clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
      if (agentMenuRef.current && !agentMenuRef.current.contains(event.target)) {
        setShowAgentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Timer de connexion/pause
  useEffect(() => {
    let timer;
    if (status === 'disponible') {
      if (!startTime) setStartTime(Date.now());
      timer = setInterval(() => setWorkTime((prev) => prev + 1), 1000);
    } else if (status === 'pause' || status === 'indisponible') {
      timer = setInterval(() => setPauseTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };


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
      {/* Gauche : Titre + Date */}
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

      {/* Droite : Notifications, Agent, Statuts, Timer */}
      <div className="flex items-center space-x-6 relative">
        {/* Notifications */}
        <div ref={notifRef} className="relative cursor-pointer" onClick={() => setShowNotif(!showNotif)}>
          <Bell size={24} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>

          {showNotif && (
            <div className="absolute top-8 right-0 w-64 bg-white shadow-lg rounded-lg p-3 z-10">
              <p className="text-sm">❌ Votre vente <strong>#123456</strong> a été annulée.</p>
              <button
                onClick={() => window.location.href = '/ventes'}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                Voir les détails
              </button>
            </div>
          )}
        </div>

        {/* Agent menu */}
        <div ref={agentMenuRef} className="relative">
          <div
            className="flex items-center space-x-1 cursor-pointer"
            onClick={() => setShowAgentMenu(!showAgentMenu)}
          >
            <User size={22} className="text-gray-700" />
            <span className="text-sm font-medium text-gray-700">{agentName}</span>
          </div>
          {showAgentMenu && (
            <div className="absolute top-8 right-0 w-56 bg-white shadow-lg rounded-lg p-4 z-10 text-sm">
              <p><strong>Nom :</strong> Alpha</p>
              <p><strong>Prénom :</strong> Agent</p>
              <p><strong>Profil :</strong> Vendeur</p>
            </div>
          )}
        </div>

        {/* Statuts */}
        <div className="flex items-center space-x-2">
          {['disponible', 'pause', 'indisponible'].map((s) => {
            let color = 'bg-gray-200 text-gray-700';
            if (status === s) {
              if (s === 'disponible') color = 'bg-green-500 text-white';
              if (s === 'pause') color = 'bg-yellow-500 text-white';
              if (s === 'indisponible') color = 'bg-red-500 text-white';
            }
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${color}`}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Timer */}
        <div className="text-xs text-gray-600 text-right">
          <div>Connecté : {formatTime(workTime)}</div>
          <div>Pause : {formatTime(pauseTime)}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
