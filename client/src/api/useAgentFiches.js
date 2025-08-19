// src/api/useAgentFiches.js
import { useState, useEffect } from 'react';
import { fetchFiches, handleTraitement, onCancelFiche, handleCloture, handleProgramRdv } from '../api/filesActions.js';

export default function useFiches(user) {
  const [fiches, setFiches] = useState([]);

  const loadFiches = async () => {
    if (!user?.id) return;
    const allFiches = await fetchFiches();
    setFiches(Array.isArray(allFiches) ? allFiches : []);

  };

  useEffect(() => {
    if (user?.id) {
      loadFiches();
    }
  }, [user]);

  return {
    fiches,
    loadFiches,
    onTreatFiche: (id) => handleTraitement(id, user, setFiches).then(loadFiches),
    onCloseFiche: (id, data) => handleCloture(id, data, user, loadFiches),
    onProgramRdv: (ficheId, rdvDate, commentaire) => handleProgramRdv(ficheId, rdvDate, commentaire, loadFiches),
    onCancelFiche: (id) => onCancelFiche(id, loadFiches),
  };
}
