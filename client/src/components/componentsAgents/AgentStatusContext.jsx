// componentsAgents/AgentStatusContext.jsx
import React, { createContext, useContext, useState } from 'react';

const AgentStatusContext = createContext();

export const AgentStatusProvider = ({ children }) => {
  const [status, setStatus] = useState('indisponible');
  const [pauseType, setPauseType] = useState(null);
  const [startTime, setStartTime] = useState(null);

  return (
    <AgentStatusContext.Provider
      value={{ status, setStatus, pauseType, setPauseType, startTime, setStartTime }}
    >
      {children}
    </AgentStatusContext.Provider>
  );
};

export const useAgentStatus = () => useContext(AgentStatusContext);
