/**
 * src/api/historiqueFiles.ts
 * ---------------------------------------------------
 * API responsable de la journalisation (historique)
 * des actions effectuées sur les fiches du CRM.
 * 
 * Chaque action (prise en charge, annulation, clôture, RDV, etc.)
 * crée une entrée dans la table `historique_files` du backend.
 * ---------------------------------------------------
 */
import axiosInstance from "./axiosInstance";

interface LogParams {
  ficheId: number;
  action: string;
  actorId: string | number;
  actorName: string;
  commentaire?: string;
  metadata?: object;
}

export const logHistorique = async ({
  ficheId,
  action,
  actorId,
  actorName,
  commentaire = '',
  metadata = {}
}: LogParams) => {
  try {
    await axiosInstance.post('/historiques', {
        fiche_id: ficheId,
        action,
        actor_id: actorId,
        actor_name: actorName,
        commentaire,
        metadata
    });
  } catch (error) {
    console.error('Erreur lors de la création du log historique :', error);
  }
};
