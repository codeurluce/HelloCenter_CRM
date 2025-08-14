// src/api/useTimers.js
import { useState, useEffect } from 'react';

const initialTimersTemplate = {
  "Disponible": 0,
  "Pause Café": 0,
  "Pause Déjeuner": 0,
  "Formation": 0,
  "Autre Pause": 0,
  "Indisponible": 0,
};

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

  useEffect(() => {
    localStorage.setItem("timers", JSON.stringify({
      etat,
      timers,
      lastChange: lastChange ? lastChange.toISOString() : null,
    }));
  }, [etat, timers, lastChange]);

  const onStatusChange = (newEtat) => {
    if (etat && lastChange && !isNaN(new Date(lastChange).getTime())) {
      const duree = Math.floor((Date.now() - new Date(lastChange).getTime()) / 1000);
      if (timers[etat] !== undefined && duree > 0) {
        setTimers(prev => ({ ...prev, [etat]: prev[etat] + duree }));
      }
    }
    setEtat(newEtat);
    setLastChange(new Date());
    setElapsed(0);
  };

  return { etat, timers, lastChange, elapsed, onStatusChange, setEtat, setTimers, setLastChange, setElapsed };
}
