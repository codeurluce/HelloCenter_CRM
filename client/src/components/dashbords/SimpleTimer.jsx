import React, { useEffect, useState } from 'react';
import { startSession, closeSession } from '../../api/saveSessionToDB';
import socket from '../../socket';
import StatusSelector, { statuses, formatTime } from '../../shared/StatusSelector.jsx';

const SimpleTimer = ({
  userId,
  status,          // statut en français
  timers,          // { key: secondes cumulées }
  currentSession,  // { start_time: Date, status: string }
  onStatusChange,
}) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (userId) {
      socket.emit('agent_connected', { userId });
    }
    return () => {
      if (userId) socket.emit('agent_disconnected', { userId });
    };
  }, [userId]);

  // Timer pour re-render chaque seconde
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Calcul dynamique temps écoulé
const elapsed = currentSession?.start_time
  ? Math.floor((Date.now() - new Date(currentSession.start_time).getTime()) / 1000)
  : 0;

  const currentKey = currentSession
    ? statuses.find(s => s.statusFr === currentSession.status)?.key || null
    : null;

  const pauseKeys = ["pause_cafe_1", "pause_dejeuner", "pause_cafe_2"];
  const indispoKeys = ["reunion", "pause_formation", "brief"];
  const dispoKey = statuses.find((s) => s.key === "disponible")?.key;

  const totalDispo = (timers[dispoKey] || 0) + (currentKey === dispoKey ? elapsed : 0);
  const totalPause = pauseKeys.reduce((sum, key) => sum + (timers[key] || 0) + (currentKey === key ? elapsed : 0), 0);
  const totalIndispo = indispoKeys.reduce((sum, key) => sum + (timers[key] || 0) + (currentKey === key ? elapsed : 0), 0);

  const handleStatusChange = async (newEtatFr, pause) => {
    if (!userId) {
      console.error("Utilisateur non connecté");
      return;
    }

    try {
      await closeSession({ user_id: userId });
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || '';
      if (!msg.includes('Aucune session active') && !msg.includes('no active session')) {
        console.error('Erreur fermeture session:', error);
        return;
      }
    }

    const pauseType = pause || null;

    try {
      await startSession({ user_id: userId, status: newEtatFr, pause_type: pauseType });
      onStatusChange(newEtatFr, pauseType);
      socket.emit('agent_status_update', {
        userId,
        status: newEtatFr,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur gestion session:', error);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4 text-sm">
      <StatusSelector
        currentStatus={status}
        onSelect={handleStatusChange}
        mode="icons"
      />

      <div>⏱️ Temps de travail : <strong>{formatTime(totalDispo)}</strong></div>
      <div>💤 Pause totale : <strong>{formatTime(totalPause)}</strong></div>
      {totalIndispo > 0 && <div>🚫 Indisponibilités : <strong>{formatTime(totalIndispo)}</strong></div>}
    </div>
  );
};

export default SimpleTimer;