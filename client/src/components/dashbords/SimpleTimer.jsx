//  components/dashboard/SimpleTimer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { saveSessionToDB } from '../../api/saveSessionToDB';

const agentId = localStorage.getItem('agentId'); // récupère l'ID agent stocké

const SimpleTimer = () => {
  const [status, setStatus] = useState(localStorage.getItem('agentStatus') || 'indisponible');
  const [sessionTime, setSessionTime] = useState(parseInt(localStorage.getItem('sessionTime')) || 0);
  const [pauseTime, setPauseTime] = useState(parseInt(localStorage.getItem('pauseTime')) || 0);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
  const timerRef = useRef(null);
const storedUser = JSON.parse(localStorage.getItem('user'));
const userId = storedUser?.id;
if (!userId) {
  console.error('❌ Aucun user connecté !');
}
  // Timer principal
  useEffect(() => {
    clearInterval(timerRef.current);

    if (status === 'disponible') {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => {
          const updated = prev + 1;
          localStorage.setItem('sessionTime', updated);
          return updated;
        });
      }, 1000);
    } else if (status === 'pause') {
      timerRef.current = setInterval(() => {
        setPauseTime((prev) => {
          const updated = prev + 1;
          localStorage.setItem('pauseTime', updated);
          return updated;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [status]);

  // Changement de statut + enregistrement session
  const handleStatusChange = async (newStatus) => {
    const now = new Date().toISOString();

 if (startTime && userId) {
    await saveSessionToDB({
      status: currentStatus, // statut avant changement
      startTime,
      endTime: now,
    });
  }

    // Met à jour les états
    setStatus(newStatus);
    setStartTime(now);
    localStorage.setItem('agentStatus', newStatus);
    setCurrentStatus(newStatus);
        
  };
  // Si l’agent quitte la page
  useEffect(() => {
    const handleUnload = () => {
      if (status && startTime) {
        saveSessionToDB({ user_id: agentId, status, startTime, endTime: new Date().toISOString() });
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [status, startTime]);

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-start gap-2 text-sm">
      <div className="flex gap-2">
        <button
          className={`px-3 py-1 rounded ${status === 'disponible' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          onClick={() => handleStatusChange('disponible')}
        >
          Disponible
        </button>
        <button
          className={`px-3 py-1 rounded ${status === 'pause' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
          onClick={() => handleStatusChange('pause')}
        >
          Pause
        </button>
        <button
          className={`px-3 py-1 rounded ${status === 'indisponible' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
          onClick={() => handleStatusChange('indisponible')}
        >
          Indisponible
        </button>
      </div>

      <div>
        ⏱️ Temps connecté : <strong>{formatTime(sessionTime)}</strong>
      </div>
      {pauseTime > 0 && (
        <div>
          💤 Pause : <strong>{formatTime(pauseTime)}</strong>
        </div>
      )}
    </div>
  );
};

export default SimpleTimer;
