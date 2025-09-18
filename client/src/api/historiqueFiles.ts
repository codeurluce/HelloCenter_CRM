// src/api/historiqueFiles.ts 
// API pour l'historique des fichiers
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
