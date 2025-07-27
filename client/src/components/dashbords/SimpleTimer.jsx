import React, { useState, useEffect, useRef } from 'react';
import { saveSessionToDB } from '../../api/saveSessionToDB';

const SimpleTimer = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.id;
  const timerRef = useRef(null);

  const [status, setStatus] = useState('indisponible');
  const [sessionTime, setSessionTime] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // ⏱ Vérifie l'inactivité supérieure à 1h
  const checkInactivityAndReset = () => {
    const lastActive = localStorage.getItem('lastActive');
    if (lastActive) {
      const diff = Date.now() - parseInt(lastActive);
      if (diff > 60 * 60 * 1000) {
        localStorage.removeItem('sessionTime');
        localStorage.removeItem('pauseTime');
        localStorage.removeItem('agentStatus');
      }
    }
  };

  useEffect(() => {
    checkInactivityAndReset();

    if (!userId) {
      console.warn('❌ Aucun utilisateur connecté');
      return;
    }

    const savedStatus = localStorage.getItem('agentStatus') || 'indisponible';
    const savedSession = parseInt(localStorage.getItem('sessionTime')) || 0;
    const savedPause = parseInt(localStorage.getItem('pauseTime')) || 0;

    setStatus(savedStatus);
    setSessionTime(savedSession);
    setPauseTime(savedPause);
  }, [userId]);

  // ⏲ Timer actif selon statut
  useEffect(() => {
    clearInterval(timerRef.current);

    if (status === 'disponible') {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => {
          const updated = prev + 1;
          localStorage.setItem('sessionTime', updated);
          localStorage.setItem('lastActive', Date.now().toString());
          return updated;
        });
      }, 1000);
    } else if (status === 'pause') {
      timerRef.current = setInterval(() => {
        setPauseTime((prev) => {
          const updated = prev + 1;
          localStorage.setItem('pauseTime', updated);
          localStorage.setItem('lastActive', Date.now().toString());
          return updated;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [status]);

  // 🟢 Changement de statut avec sauvegarde immédiate
  const handleStatusChange = async (newStatus) => {
    const now = new Date().toISOString();

    if (startTime && userId && status !== 'indisponible') {
      try {
        await saveSessionToDB({
          user_id: userId,
          status,
          startTime,
          endTime: now,
        });
      } catch (error) {
        console.error('Erreur de sauvegarde de session :', error);
      }
    }

    if (newStatus === 'indisponible') {
      localStorage.removeItem('sessionTime');
      localStorage.removeItem('pauseTime');
      localStorage.removeItem('agentStatus');
    } else {
      localStorage.setItem('agentStatus', newStatus);
      localStorage.setItem('lastActive', Date.now().toString());
    }

    setStatus(newStatus);
    setStartTime(newStatus !== 'indisponible' ? now : null);
  };

  // 🛑 Sauvegarde automatique à la fermeture ou actualisation
  useEffect(() => {
    const handleUnload = () => {
      if (userId && startTime && status !== 'indisponible') {
        saveSessionToDB({
          user_id: userId,
          status,
          startTime,
          endTime: new Date().toISOString(),
        });
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [userId, status, startTime]);

  // ⌛ Formatage temps HH:MM:SS
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
