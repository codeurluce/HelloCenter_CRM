// AgentStatusContext.js
import React, { createContext, useState, useContext, useEffect, useRef } from "react";

const AgentStatusContext = createContext();

export const AgentStatusProvider = ({ children }) => {
  const [status, setStatus] = useState(() => localStorage.getItem("agentStatus") || "indisponible");
  const [sessionTime, setSessionTime] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const intervalRef = useRef(null);
  const lastStartTimeRef = useRef(null);

  // Fonction principale pour démarrer un timer horloge (pas par incrémentation)
  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    lastStartTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastStartTimeRef.current;
      lastStartTimeRef.current = Date.now();

      if (status === "disponible") {
        setSessionTime(prev => prev + elapsed);
      } else if (status.includes("pause")) {
        setPauseTime(prev => prev + elapsed);
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const changeStatus = (newStatus) => {
    setStatus(newStatus);
    localStorage.setItem("agentStatus", newStatus);

    if (newStatus === "disponible" || newStatus.includes("pause")) {
      startTimer();
    } else {
      stopTimer();
    }
  };

  // Sur le premier chargement, on redémarre le timer si statut actif
  useEffect(() => {
    if (status === "disponible" || status.includes("pause")) {
      startTimer();
    }
    return () => stopTimer();
  }, []);

  return (
    <AgentStatusContext.Provider value={{
      status,
      sessionTime,
      pauseTime,
      setStatus: changeStatus
    }}>
      {children}
    </AgentStatusContext.Provider>
  );
};

export const useAgentStatus = () => useContext(AgentStatusContext);
