// components/dashbords/SimpleTimer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Utensils, BookOpenCheck, UserCheck, UserX, Clock5 } from 'lucide-react';
import { saveSessionToDB } from '../../api/saveSessionToDB';
import socket from '../../socket';

const STATUS_ICONS = {
  disponible: { icon: UserCheck, label: 'Disponible', color: 'text-green-600' },
  pause_autre: { icon: Clock5, label: 'Pause', color: 'text-gray-500' },
  pause_cafe: { icon: Coffee, label: 'Pause Café', color: 'text-orange-500' },
  pause_repas: { icon: Utensils, label: 'Pause Repas', color: 'text-yellow-500' },
  pause_formation: { icon: BookOpenCheck, label: 'Pause Formation', color: 'text-blue-500' },
  indisponible: { icon: UserX, label: 'Indisponible', color: 'text-red-500' },
};

const SimpleTimer = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.id;
  const timerRef = useRef(null);

  const [status, setStatus] = useState('indisponible');
  const [sessionTime, setSessionTime] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [pauseType, setPauseType] = useState(null);

  useEffect(() => {
    if (userId) {
      socket.emit('agent_connected', { userId });
    }
    return () => {
      socket.emit('agent_disconnected', { userId });
    };
  }, [userId]);

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
    } else if (status.startsWith('pause')) {
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

  const handleStatusChange = async (newStatus, pause = null) => {
    const now = new Date().toISOString();

    if (userId && startTime && status !== 'indisponible') {
      try {
        await saveSessionToDB({
          user_id: userId,
          status,
          startTime,
          pause_type: pauseType,
          endTime: now,
        });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de session:', error);
      }
    }

    if (newStatus === 'indisponible') {
      localStorage.setItem('agentStatus', newStatus);
      localStorage.setItem('lastActive', Date.now().toString());
      setPauseType(null);
      setStartTime(null);
    } else {
      const newStart = new Date().toISOString();
      localStorage.setItem('agentStatus', newStatus);
      localStorage.setItem('lastActive', Date.now().toString());
      localStorage.setItem('startTime', newStart);
      setStartTime(newStart);

      if (newStatus.startsWith('pause')) {
        setPauseType(pause);
      } else {
        setPauseType(null);
      }
    }

    setStatus(newStatus);

    socket.emit('agent_status_update', {
      userId,
      status: newStatus,
      timestamp: now,
    });
  };

  useEffect(() => {
    const handleUnload = () => {
      if (userId && startTime && status !== 'indisponible') {
        saveSessionToDB({
          user_id: userId,
          status,
          pause_type: pauseType,
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
    <div className="flex flex-col items-start gap-4 text-sm">
      <div className="flex items-center gap-4">
        {Object.entries(STATUS_ICONS).map(([key, { icon: Icon, label, color }]) => {
          const isActive = status === key;
          return (
            <div
              key={key}
              className="group relative cursor-pointer p-2 rounded hover:bg-gray-100 transition"
              onClick={() =>
                handleStatusChange(key, key.startsWith('pause') ? key.split('_')[1] : null)
              }
            >
              <Icon className={`text-xl transition-all ${isActive ? color : 'text-gray-400'} ${isActive ? 'scale-125' : 'opacity-70'}`} />
              <div className="absolute left-1/2 -translate-x-1/2 mt-8 bg-black text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-10">
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        ⏱️ Temps connecté : <strong>{formatTime(sessionTime)}</strong>
      </div>
      {pauseTime > 0 && (
        <div>
          💤 Pause totale : <strong>{formatTime(pauseTime)}</strong>
        </div>
      )}
    </div>
  );
};

export default SimpleTimer;
