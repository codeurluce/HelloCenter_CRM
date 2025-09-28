// components/dashbords/SimpleTimer.jsx
import React, { useEffect } from 'react';
import { startSession, closeSession } from '../../api/saveSessionToDB';
import socket from '../../socket';
import StatusSelector, { formatTime } from '../../shared/StatusSelector.jsx';

const SimpleTimer = ({
  userId,
  status,      // Ex: 'Disponible' en français
  sessionTime,
  totalPause,  // en secondes
  totalIndispo, // en secondes
  onStatusChange,
}) => {

  useEffect(() => {
    if (userId) {
      socket.emit('agent_connected', { userId });
    }
    return () => {
      if (userId) socket.emit('agent_disconnected', { userId });
    };
  }, [userId]);

  // newEtatFr = statut en français passé par StatusSelector
  // pause = valeur optionnelle (ex: 'cafe', 'dejeuner', etc.) fournie par le StatusSelector
  const handleStatusChange = async (newEtatFr, pause) => {
    if (!userId) {
      console.error("Utilisateur non connecté");
      return;
    }

    try {
      // Fermer session active (si elle existe)
      await closeSession({ user_id: userId });
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || '';
      // ignorer le cas "no active session" ou message francophone équivalent
      if (!msg.includes('Aucune session active') && !msg.includes('no active session')) {
        console.error('Erreur fermeture session:', error);
        return;
      }
    }

    const pauseType = pause || null;

    try {
      // Démarre une nouvelle ligne en base (startSession doit créer un INSERT)
      await startSession({ user_id: userId, status: newEtatFr, pause_type: pauseType });

      // update local state via parent
      onStatusChange(newEtatFr, pauseType);

      // notifier via socket
      socket.emit('agent_status_update', {
        userId,
        status: newEtatFr,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur lors de la gestion de la session en base:', error);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4 text-sm">
      <StatusSelector
        currentStatus={status}
        onSelect={handleStatusChange}
        mode="icons"
      />

      <div>⏱️ Temps de travail : <strong>{formatTime(sessionTime)}</strong></div>

      <div>💤 Pause totale : <strong>{formatTime(totalPause)}</strong></div>

      {totalIndispo > 0 && (
        <div>🚫 Indisponibilités : <strong>{formatTime(totalIndispo)}</strong></div>
      )}
    </div>
  );
};

export default SimpleTimer;