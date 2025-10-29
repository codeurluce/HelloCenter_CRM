import React, { useEffect, useState, useRef } from 'react';
import { Bell, CalendarDays, User } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SimpleTimer from './SimpleTimer';
import axiosInstance from '../../api/axiosInstance.js';
import StatusSelector, { statuses } from "../../shared/StatusSelector.jsx";

const DashboardHeader = ({
  activePage,
  etat,
  timers,
  currentSession,
  onStatusChange,
  pauseType,
  currentAgent,
}) => {
  const [connectedAgent, setConnectedAgent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showNotif, setShowNotif] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [rdvNotifications, setRdvNotifications] = useState([]);
  const [hasNewRDVNotif, setHasNewRDVNotif] = useState(false);

  const notifRef = useRef(null);
  const agentMenuRef = useRef(null);
  const calendarRef = useRef(null);
  const notifiedIdsRef = useRef(new Set());

  // Charge agent depuis localStorage
  useEffect(() => {
    const storedAgent = localStorage.getItem('user');
    if (storedAgent) {
      const agent = JSON.parse(storedAgent);
      setConnectedAgent(agent);

      const storedNotifFlag = localStorage.getItem(`hasNewRDVNotif_${agent.id}`) === 'true';
      const storedNotifications = JSON.parse(localStorage.getItem(`rdvNotifications_${agent.id}`)) || [];

      if (storedNotifFlag && storedNotifications.length > 0) {
        setHasNewRDVNotif(true);
        setRdvNotifications(storedNotifications);
      }
    }
  }, []);

  // Gestion click hors notifications / menus agent
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitles = {
    dashboard: 'Tableau de bord',
    files: 'Fichiers',
    sales: 'Ventes',
    appointments: 'Rendez-vous',
    activité: 'Mon Activité',
    settings: 'Paramètres',
    sessions: 'Suivi des Agents',
    rh: 'Ressources Humaines',
    comptable: 'Comptabilité',
    administration: 'administration'
  };
  const displayTitle = pageTitles[activePage] || 'Page';

  return (
    // <div className="flex items-center justify-between p-4 bg-white shadow rounded-lg sticky top-0 z-50">
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 text-black dark:text-white shadow rounded-lg sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-semibold">{displayTitle}</h1>
        <div
          onClick={() => calendarRef.current?.setOpen(true)}
          // className="flex items-center space-x-2 bg-blue-100 text-blue-600 px-3 py-1 rounded-lg cursor-pointer"
          className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-lg cursor-pointer"
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

      <div className="flex items-center space-x-6 relative">
        {/* Notifications */}
        <div ref={notifRef} className="relative cursor-pointer" onClick={() => setShowNotif(show => !show)}>
          <Bell size={24} className={`${hasNewRDVNotif ? 'animate-bounce text-red-500' : 'text-gray-500'}`} />
          {hasNewRDVNotif && (
            <>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </>
          )}
          {showNotif && (
            <div className="absolute top-8 right-0 w-72 bg-white dark:bg-gray-700 shadow-lg rounded-lg p-3 z-10">
           {/* <div className="absolute top-8 right-0 w-72 bg-white shadow-lg rounded-lg p-3 z-10"> */}
              {rdvNotifications.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune notification</p>
              ) : (
                rdvNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition"
                    onClick={() => {
                      const updated = rdvNotifications.filter(n => n.id !== notif.id);
                      setRdvNotifications(updated);
                      localStorage.setItem(`rdvNotifications_${connectedAgent.id}`, JSON.stringify(updated));
                    }}
                  >
                    {/* <p className="text-sm font-medium text-black">{notif.message}</p> */}
                    <p className="text-sm font-medium text-black dark:text-white">{notif.message}</p>
                    {/* <p className="text-xs text-gray-500">📌 {notif.commentaire}</p> */}
                    <p className="text-xs text-gray-500 dark:text-gray-300">📌 {notif.commentaire}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Agent Menu */}
        <div ref={agentMenuRef} className="relative">
          <div
            className="flex items-center space-x-1 cursor-pointer"
            onClick={() => setShowAgentMenu(!showAgentMenu)}
          >
            {/* <User size={22} className="text-gray-700" /> */}
            <User size={22} className="text-gray-700 dark:text-gray-200" />
            {/* <span className="text-sm font-medium text-gray-700"> */}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {connectedAgent ? `${connectedAgent.firstname} ${connectedAgent.lastname}` : '...'}
            </span>
          </div>
          {showAgentMenu && connectedAgent && (
            <div className="absolute top-8 right-0 w-56 bg-white dark:bg-gray-700 shadow-lg rounded-lg p-4 z-10 text-sm text-black dark:text-white">
            {/* <div className="absolute top-8 right-0 w-56 bg-white shadow-lg rounded-lg p-4 z-10 text-sm"> */}
              <p><strong>Nom :</strong> {connectedAgent.firstname}</p>
              <p><strong>Prénom :</strong> {connectedAgent.lastname}</p>
              <p><strong>Profil :</strong> {connectedAgent.univers}</p>
              <p><strong>Role :</strong> {connectedAgent.role}</p>
            </div>
          )}
        </div>

        {/* SimpleTimer */}
        <SimpleTimer
          userId={connectedAgent?.id || null}
          timers={timers}
          status={etat}
          currentSession={currentSession}
          pauseType={pauseType}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
};

export default DashboardHeader;