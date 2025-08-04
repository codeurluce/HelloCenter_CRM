// src/api/filesActions.js
// Actions pour la gestion des fichiers dans le CRM


import axiosInstance from './axiosInstance';
import { logHistorique } from './historiqueFiles.ts';

// 📦 Charger les fiches
export const fetchFiches = async () => {
  try {
    const response = await axiosInstance.get('/files');
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des fiches :', error);
    return [];
  }
};


// ⚙️ Prise en charge fiche (mise à jour)
export const handleTraitement = async (ficheId, user, setFiches) => {
console.log('👤 Utilisateur courant :', user);
console.log('🆔 user.id =', user?.id);
  if (!user) {
    console.error("Utilisateur non connecté.");
    return;
  }

  try {
    const response = await axiosInstance.put(`/files/${ficheId}/traiter`, {
      statut: 'en_traitement',
      assigned_to: user.id,
      assigned_to_name: `${user.firstname} ${user.lastname}`,
      date_modification: new Date().toISOString(),
    });

    const updatedFiche = response.data;

    // Mise à jour locale
    setFiches((prev) =>
      prev.map((f) => (f.id === ficheId ? updatedFiche : f))
    );

    // Logging
    await logHistorique({
      ficheId,
      action: 'PRISE_EN_CHARGE',
      actorId: user.id,
      actorName: `${user.firstname} ${user.lastname}`,
      commentaire: 'Fiche prise en charge'
    });

  } catch (err) {
    console.error('Erreur prise en charge fiche:', err);
  }
};


// 🔄 Annuler la fiche prise en charge
export const onCancelFiche = async (ficheId, fetchFiches) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    console.error('Utilisateur non connecté.');
    return;
  }

  try {
    await axiosInstance.put(`/files/${ficheId}/annuler`, {
      statut: 'nouvelle',
      assigned_to: null,
    });

    await logHistorique({
      ficheId,
      action: 'ANNULATION',
      actorId: user.id,
      actorName: `${user.firstname} ${user.lastname}`,
      commentaire: 'Fiche remise en "nouvelle"',
    });

    fetchFiches();
  } catch (error) {
    console.error("Erreur lors de l'annulation de la prise en charge :", error);
  }
};

// ✅ Clôturer fiche
export const handleCloture = async (ficheId, data, user, fetchFiches) => {
   if (!user) {
    console.error('Utilisateur non connecté.');
    return;
  }

  try {
    await axiosInstance.put(`/files/${ficheId}/cloturer`, {
      statut: 'cloturee',
      tag: data.tag,
      commentaire: data.commentaire,
      assigned_to: user.id,
      assigned_to_name: `${user.firstname} ${user.lastname}`,
      date_modification: new Date(),
    });

    await logHistorique({
      ficheId,
      action: 'CLOTURE',
      actorId: user.id,
      actorName: `${user.firstname} ${user.lastname}`,
      commentaire: `Fiche clôturée avec tag "${data.tag}"`,
    });

    fetchFiches();
  } catch (err) {
    console.error('Erreur lors de la clôture de la fiche :', err);
  }
};

// 📅 Programmer RDV
export const handleProgramRdv = async (ficheId, fetchFiches) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    console.error('Utilisateur non connecté.');
    return;
  }

  try {
    await axiosInstance.put(`/files/${ficheId}/rdv`, {
      statut: 'en_traitement',
      rendezVous: true,
    });

    await logHistorique({
      ficheId,
      action: 'PROGRAMMATION_RDV',
      actorId: user.id,
      actorName: `${user.firstname} ${user.lastname}`,
      commentaire: 'Rendez-vous programmé',
    });

    fetchFiches();
  } catch (err) {
    console.error('Erreur lors de la programmation du RDV :', err);
  }
};
