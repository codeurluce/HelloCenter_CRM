// src/api/useAgentFiches.js
import { useState, useEffect } from 'react';
import {
  fetchFichesAssigned,
  handleTraitement,
  handleCancelFiche,
  handleCloture,
  handleEnregistrerFicheSansCloture,
  handleProgramRdv
} from '../api/filesActions.js';

export default function useFiches(user) {
  const [fiches, setFiches] = useState([]);

  const loadFiches = async () => {
    if (!user?.id) return;
    const allFiches = await fetchFichesAssigned();
    if (Array.isArray(allFiches)) {
      // Tri explicite par date_creation ASC
      const sortedFiches = allFiches.sort((a, b) => new Date(a.date_creation) - new Date(b.date_creation));
      setFiches(sortedFiches);
    } else {
      setFiches([]);
    }
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
    onProgramRdv: (ficheId, rdvDate, commentaire, tag) => handleProgramRdv(ficheId, rdvDate, commentaire, tag, loadFiches),
    onCancelFiche: (id) => handleCancelFiche(id, loadFiches),
    onEnregistrerFicheSansCloture: async (id, data) => {
      await handleEnregistrerFicheSansCloture(id, data, user); // Appel API backend
      await loadFiches(); // Rafraîchit la liste
    },
  };
}