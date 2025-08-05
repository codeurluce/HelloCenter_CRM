import React, { useEffect, useState, useRef } from 'react';
import { Bell, CalendarDays, User } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SimpleTimer from './SimpleTimer';

const DashboardHeader = ({ activePage }) => {
  const [status, setStatus] = useState('indisponible');
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

  const fetchFichesRdv = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/files?statut=rendez_vous');
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des fiches avec rendez-vous :', error);
      return [];
    }
  };

  const playAlertSound = () => {
    const audio = new Audio('/notification.wav');
    audio.play().catch((err) => console.error("Erreur lecture audio :", err));
  };

  useEffect(() => {
    const checkRDVs = async () => {
      const fiches = await fetchFichesRdv();
      const now = new Date();
      const newNotifs = [];
      let shouldNotify = false;

      for (const fiche of fiches) {
        const rdvDate = new Date(fiche.rendez_vous_date);
const localRDV = new Date(
  rdvDate.getUTCFullYear(),
  rdvDate.getUTCMonth(),
  rdvDate.getUTCDate(),
  rdvDate.getUTCHours(),
  rdvDate.getUTCMinutes()
);

const localNow = new Date();
const diffMs = localRDV.getTime() - localNow.getTime();
const diffMin = Math.round(diffMs / 60000);
        // const roundedDiff = Math.round(diffMs / 60000); 

        if (( diffMin === 2 || diffMin === 0 ) && !notifiedIdsRef.current.has(`${fiche.id}_${diffMin}`)) {
            console.log(`RDV prévu à : ${localRDV.toLocaleString()} | Maintenant : ${localNow.toLocaleString()} | Différence = ${diffMin} min`);

            setRdvNotifications(prev => prev.filter(n => n.id !== fiche.id));
          newNotifs.push({
            id: fiche.id,
            nom: `${fiche.nom_client} ${fiche.prenom_client}`,
            commentaire: fiche.rendez_vous_commentaire,
            message: `\u23F0 RDV avec ${fiche.prenom_client} ${fiche.nom_client} dans ${diffMin} minute(s)`
          });
          notifiedIdsRef.current.add(`${fiche.id}_${diffMin}`);
          shouldNotify = true;
        }

        if (diffMin < 0 && diffMin > -1) {
          await fetch(`http://localhost:5000/api/files/${fiche.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: 'en_traitement' })
          });
        }
      }

      if (shouldNotify) {
        const updatedNotifs = [...rdvNotifications, ...newNotifs];
        setRdvNotifications(updatedNotifs);
        setHasNewRDVNotif(true);
        playAlertSound();
        localStorage.setItem('hasNewRDVNotif', 'true');
        localStorage.setItem('rdvNotifications', JSON.stringify(updatedNotifs));
      }
    };

    checkRDVs();
    const interval = setInterval(checkRDVs, 60 * 1000);
    return () => clearInterval(interval);
  }, [rdvNotifications]);

  useEffect(() => {
    const storedAgent = localStorage.getItem('user');
    const storedStatus = localStorage.getItem('status');
    const storedNotifFlag = localStorage.getItem('hasNewRDVNotif') === 'true';
    const storedNotifications = JSON.parse(localStorage.getItem('rdvNotifications')) || [];

    if (storedAgent) setConnectedAgent(JSON.parse(storedAgent));
    if (storedStatus) setStatus(storedStatus);
    if (storedNotifFlag && storedNotifications.length > 0) {
      setHasNewRDVNotif(true);
      setRdvNotifications(storedNotifications);
    }
  }, []);

  const handleNotifClick = () => {
    setShowNotif(!showNotif);
    setHasNewRDVNotif(false);
    localStorage.setItem('hasNewRDVNotif', 'false');
  };

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitles = {
    dashboard: 'Tableau de bord',
    files: 'Fichiers',
    sales: 'Ventes',
    appointments: 'Rendez-vous',
    agents: 'Espace Agent',
    settings: 'Param\u00e8tres',
  };

  const displayTitle = pageTitles[activePage] || 'Page';

  return (
    <div className="flex items-center justify-between p-4 bg-white shadow rounded-lg sticky top-0 z-50">
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

      <div className="flex items-center space-x-6 relative">
        <div ref={notifRef} className="relative cursor-pointer" onClick={handleNotifClick}>
          <Bell size={24} className={`${hasNewRDVNotif ? 'animate-bounce text-red-500' : 'text-gray-500'}`} />
          {hasNewRDVNotif && (
            <>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </>
          )}
          {showNotif && (
            <div className="absolute top-8 right-0 w-72 bg-white shadow-lg rounded-lg p-3 z-10">
              {rdvNotifications.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune notification</p>
              ) : (
                rdvNotifications.map((notif, idx) => (
                  <div
    key={idx}
    className="mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition"
    onClick={() => {
      const updated = rdvNotifications.filter((n) => n.id !== notif.id);
      setRdvNotifications(updated);
      localStorage.setItem('rdvNotifications', JSON.stringify(updated));
    }}
  >
    <p className="text-sm font-medium text-black">{notif.message}</p>
    <p className="text-xs text-gray-500">📌 {notif.commentaire}</p>
  </div>
                ))
              )}
            </div>
          )}
        </div>

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
              <p><strong>Nom :</strong> {connectedAgent.firstname}</p>
              <p><strong>Prénom :</strong> {connectedAgent.lastname}</p>
              <p><strong>Profil :</strong> {connectedAgent.univers}</p>
              <p><strong>Role :</strong> {connectedAgent.role}</p>
            </div>
          )}
        </div>

        <SimpleTimer />
      </div>
    </div>
  );
};

export default DashboardHeader;