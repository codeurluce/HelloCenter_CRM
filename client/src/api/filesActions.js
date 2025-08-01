// src/api/filesActions.js
// Actions pour la gestion des fichiers dans le CRM 

import axiosInstance  from './axiosInstance';

// 📦 Charger les fiches
export const fetchFiches = async () => {
  try {
    const response = await axiosInstance.get('/files');
    return response.data; // <-- on retourne les données
  } catch (error) {
    console.error('Erreur lors du chargement des fiches :', error);
    return []; // retourne un tableau vide en cas d’erreur
  }
};

// ⚙️ Prise en charge fiche
export const handleTraitement = async (ficheId, agent_id, setFiches) => {
  try {
   const response = await axiosInstance.put(`/files/${ficheId}/traiter`, {
      statut: 'en_traitement',
      assigned_to: agent_id,
      date_modification: new Date().toISOString(),
    });
    const updatedFiche = response.data;

    // Mise à jour locale sans recharger tout
    setFiches((prev) =>
      prev.map((f) => (f.id === ficheId ? updatedFiche : f))
    );
  } catch (err) {
    console.error('Erreur prise en charge fiche:', err);
  }
};


// 🔄 Annuler la fiche prise en charge
export const onCancelFiche = async (ficheId, fetchFiches) => {
  try {
    await axiosInstance.put(`/files/${ficheId}/annuler`, {
      statut: 'nouvelle',
      agent_id: null,
    });
    fetchFiches();
  } catch (error) {
    console.error("Erreur lors de l'annulation de la prise en charge :", error);
  }
};

// ✅ Clôturer fiche
export const handleCloture = async (ficheId, data, fetchFiches) => {
  try {
    await axiosInstance.put(`/files/${ficheId}/cloturer`, {
      statut: 'cloturee',
      tag: data.tag,
      commentaire: data.commentaire,
      date_modification: new Date(),
    });
    fetchFiches();
  } catch (err) {
    console.error('Erreur lors de la clôture de la fiche :', err);
  }
};

// 📅 Programmer RDV
export const handleProgramRdv = async (ficheId, fetchFiches) => {
  try {
    await axiosInstance.put(`/files/${ficheId}/rdv`, {
      statut: 'en_traitement',
      rendezVous: true,
    });
    fetchFiches();
  } catch (err) {
    console.error('Erreur lors de la programmation du RDV :', err);
  }
};
