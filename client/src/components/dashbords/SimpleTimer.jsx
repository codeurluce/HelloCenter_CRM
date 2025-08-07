// components/dashbords/SimpleTimer.jsx
import React, { useEffect, useRef } from 'react';
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

// Correspondance états français => clés icones
const statusKeyMap = {
  'Disponible': 'disponible',
  'Indisponible': 'indisponible',
  'Pause Café': 'pause_cafe',
  'Pause Déjeuner': 'pause_repas',
  'Formation': 'pause_formation',
  'Autre Pause': 'pause_autre',
};

const SimpleTimer = ({
  userId,
  status,      // Ex: 'Disponible' en français
  sessionTime, // en secondes
  pauseTime,   // en secondes
  startTime,
  pauseType,
  onStatusChange,
}) => {
  const timerRef = useRef(null);

  useEffect(() => {
    if (userId) {
      socket.emit('agent_connected', { userId });
    }
    return () => {
      socket.emit('agent_disconnected', { userId });
    };
  }, [userId]);

  useEffect(() => {
    clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [status]);

  const handleStatusChange = async (newStatusKey, pause = null) => {
    // Trouver état français correspondant
    const newStatusFr = Object.entries(statusKeyMap).find(([, key]) => key === newStatusKey)?.[0] || newStatusKey;
    const now = new Date().toISOString();

    if (userId && startTime && status !== 'Indisponible') {
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

    onStatusChange(newStatusFr, pause);

    socket.emit('agent_status_update', {
      userId,
      status: newStatusFr,
      timestamp: now,
    });
  };

  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return "00:00:00";
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const activeKey = statusKeyMap[status] || 'indisponible';

  return (
    <div className="flex flex-col items-start gap-4 text-sm">
      <div className="flex items-center gap-4">
        {Object.entries(STATUS_ICONS).map(([key, { icon: Icon, label, color }]) => {
          const isActive = activeKey === key;
          return (
            <div
              key={key}
              className="group relative cursor-pointer p-2 rounded hover:bg-gray-100 transition"
              onClick={() => handleStatusChange(key, key.startsWith('pause') ? key.split('_')[1] : null)}
              title={label}
            >
              <Icon
                className={`text-xl transition-all ${isActive ? color : 'text-gray-400'} ${
                  isActive ? 'scale-125' : 'opacity-70'
                }`}
              />
              <div className="absolute left-1/2 -translate-x-1/2 mt-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-10">
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
