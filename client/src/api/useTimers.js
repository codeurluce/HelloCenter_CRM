/**
 * src/api/useTimers.js
 * ---------------------------------------------------
 * Gère le suivi du temps passé par un agent dans chaque statut (Disponible, Pause, etc.)
 * Synchronisé avec localStorage pour persister les minuteries même après un rechargement de page
 * ---------------------------------------------------
 */
import { useState, useEffect } from 'react';
import { statuses } from '../shared/StatusSelector';


const initialTimersTemplate = statuses.reduce((acc, status) => {
  acc[status.statusFr] = 0;
  return acc;
}, {});

const loadInitialTimers = () => {
  const raw = localStorage.getItem("timers");
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const lastChangeDate = data.lastChange ? new Date(data.lastChange) : null;
    if (lastChangeDate && isNaN(lastChangeDate.getTime())) return null;
    return {
      etat: data.etat || null,
      timers: { ...initialTimersTemplate, ...data.timers },
      lastChange: lastChangeDate,
    };
  } catch {
    return null;
  }
};

export default function useAgentTimers() {
  const initialData = loadInitialTimers();
  const [etat, setEtat] = useState(initialData?.etat || null);
  const [timers, setTimers] = useState(initialData?.timers || initialTimersTemplate);
  const [lastChange, setLastChange] = useState(initialData?.lastChange || null);
  const [elapsed, setElapsed] = useState(0);

    // 🔸 Met à jour le temps écoulé en temps réel (toutes les secondes)
  useEffect(() => {
    if (!etat || !lastChange || isNaN(new Date(lastChange).getTime())) {
      setElapsed(0);
      return;
    }
    const updateElapsed = () => {
      const diff = Math.floor((Date.now() - new Date(lastChange).getTime()) / 1000);
      setElapsed(diff >= 0 ? diff : 0);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [etat, lastChange]);

  // 🔹 Sauvegarde automatique dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem("timers", JSON.stringify({
      etat,
      timers,
      lastChange: lastChange ? lastChange.toISOString() : null,
    }));
  }, [etat, timers, lastChange]);

    // 🔸 Gestion du changement de statut
  const onStatusChange = (newEtat) => {
    // Calcule le temps passé dans le statut précédent avant de changer
    if (etat && lastChange && !isNaN(new Date(lastChange).getTime())) {
      const duree = Math.floor((Date.now() - new Date(lastChange).getTime()) / 1000);
      if (timers[etat] !== undefined && duree > 0) {
        setTimers(prev => ({ ...prev, [etat]: prev[etat] + duree }));
      }
    }

    // Met à jour le nouveau statut et réinitialise le compteur
    setEtat(newEtat);
    setLastChange(new Date());
    setElapsed(0);
  };

  return { etat, timers, lastChange, elapsed, onStatusChange, setEtat, setTimers, setLastChange, setElapsed };
}
