import React, { useState, useEffect, useRef } from 'react';
import { saveSessionToDB } from '../../api/saveSessionToDB';
import socket from '../../socket'; // ✅ on importe le client socket

const SimpleTimer = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.id;
  const timerRef = useRef(null);

  const [status, setStatus] = useState('indisponible');
  const [sessionTime, setSessionTime] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // 🔄 Connexion Socket.IO dès que le composant se monte
  useEffect(() => {
    if (userId) {
      socket.emit('agent_connected', { userId }); // 👋 annonce la connexion
    }

    return () => {
      socket.emit('agent_disconnected', { userId }); // 🚪 annonce la déconnexion
    };
  }, [userId]);

  // 🧠 Initialisation avec vérification d'inactivité
  useEffect(() => {
    if (!userId) return;

    const lastActive = parseInt(localStorage.getItem('lastActive'));
    const now = Date.now();
    const inactiveDuration = now - lastActive;

    if (lastActive && inactiveDuration > 60 * 60 * 1000) {
      localStorage.clear();
      setStatus('indisponible');
      setSessionTime(0);
      setPauseTime(0);
      setStartTime(null);
    } else {
      const savedStatus = localStorage.getItem('agentStatus') || 'indisponible';
      const savedSession = parseInt(localStorage.getItem('sessionTime')) || 0;
      const savedPause = parseInt(localStorage.getItem('pauseTime')) || 0;
      const savedStartTime = localStorage.getItem('startTime');

      setStatus(savedStatus);
      setSessionTime(savedSession);
      setPauseTime(savedPause);
      setStartTime(savedStartTime);
    }
  }, [userId]);

  // ⏱ Timer selon statut
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

  // ⛔ Changement de statut avec socket + DB
  const handleStatusChange = async (newStatus) => {
    const now = new Date().toISOString();

    if (userId && startTime && status !== 'indisponible') {
      try {
        await saveSessionToDB({
          user_id: userId,
          status,
          startTime,
          endTime: now,
        });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de session:', error);
      }
    }

    if (newStatus === 'indisponible') {
      localStorage.clear();
      setSessionTime(0);
      setPauseTime(0);
      setStartTime(null);
    } else {
      const newStart = new Date().toISOString();
      localStorage.setItem('agentStatus', newStatus);
      localStorage.setItem('lastActive', Date.now().toString());
      localStorage.setItem('startTime', newStart);
      setStartTime(newStart);
    }

    setStatus(newStatus);

    // 🚀 Émission socket en temps réel
    socket.emit('agent_status_update', {
      userId,
      status: newStatus,
      timestamp: now,
    });
  };

  // 💾 Sauvegarde à la fermeture
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
