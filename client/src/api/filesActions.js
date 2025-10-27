/**
 * src/api/filesActions.js
 * ---------------------------------------------------
 * Ensemble des fonctions de gestion des fiches clients (CRM).
 * 
 * Contient toutes les actions principales :
 *  - Récupération des fiches
 *  - Prise en charge
 *  - Annulation
 *  - Clôture
 *  - Programmation de rendez-vous
 * 
 * Chaque action envoie une requête HTTP via `axiosInstance`
 * et enregistre un historique avec `logHistorique`.
 * ---------------------------------------------------
 */
import axiosInstance from './axiosInstance';
import { logHistorique } from './historiqueFiles.ts';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';


// =====🔹 Charger les fiches
export const fetchFiches = async () => {
  try {
    const response = await axiosInstance.get('/files');
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des fiches :', error);
    return [];
  }
};


// =====🔹 Prise en charge fiche (mise à jour)
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


// =====🔹 Annuler la fiche prise en charge
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
      commentaire: 'Prise en charge annulée',
    });

    fetchFiches();
  } catch (error) {
    console.error("Erreur lors de l'annulation de la prise en charge :", error);
  }
};

// =====🔹 Clôturer fiche
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
      commentaire: `Fiche clôturée avec le tag "${data.tag}"`,
    });

    fetchFiches();
  } catch (err) {
    console.error('Erreur lors de la clôture de la fiche :', err);
  }
};

// =====🔹 Programmer RDV + sauvegarde dans la bd
export const handleProgramRdv = async (ficheId, rdvDate, commentaire, fetchFiches) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    console.error('Utilisateur non connecté.');
    return;
  }

  const formattedDate = dayjs(rdvDate).format('DD/MM/YYYY à HH:mm');
  const fullCommentaire = commentaire
    ? `(RDV prévu le ${formattedDate}) ${commentaire} `
    : `Rendez-vous programmé le ${formattedDate}`;

  try {
    await axiosInstance.put(`/files/${ficheId}/programmer-rdv`, {
      statut: 'rendez_vous',
      rendez_vous_date: rdvDate,
      rendez_vous_commentaire: fullCommentaire,
    });

    await logHistorique({
      ficheId,
      action: 'PROGRAMMATION_RDV',
      actorId: user.id,
      actorName: `${user.firstname} ${user.lastname}`,
      commentaire: `RDV programmé : ${fullCommentaire}`,
    });

    if (fetchFiches) fetchFiches(); // ✅ rafraîchir uniquement si la fonction est passée
    toast.success('📅 RDV programmé avec succès');
  } catch (err) {
    console.error('Erreur lors de la programmation du RDV :', err);
    toast.error("❌ Une erreur s'est produite lors de la prise de rendez-vous.");
  }
};