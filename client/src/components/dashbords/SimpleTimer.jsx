// components/dashbords/SimpleTimer.jsx
import React, { useEffect, useRef } from 'react';
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

    const handleStatusChange = async (newStatusFr, pause) => {
        if (!userId) {
            console.error("Utilisateur non connecté");
            return;
        }

        try {
            // Fermer session active
            await closeSession(userId);
        } catch (error) {
            if (!error.message.includes('Aucune session active trouvée')) {
                console.error('Erreur fermeture session:', error);
                return; // ou throw selon logique
            }
            // Sinon ignore cette erreur
        }

        try {
            // Démarre une nouvelle session
            await startSession({
                userId,
                status: newStatusFr,
                pauseType: pause,
            });

            // Met à jour localement l’état après succès
            onStatusChange(newStatusFr, pause);

            // Émission socket
            socket.emit('agent_status_update', {
                userId,
                status: newStatusFr,
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

            <div>
                ⏱️ Temps de travail : <strong>{formatTime(sessionTime)}</strong>
            </div>


            <div>
                💤 Pause totale : <strong>{formatTime(totalPause)}</strong>
            </div>

            {totalIndispo > 0 && (
                <div>
                    🚫 Indisponibilités : <strong>{formatTime(totalIndispo)}</strong>
                </div>
            )}
        </div>
    );
};

export default SimpleTimer;