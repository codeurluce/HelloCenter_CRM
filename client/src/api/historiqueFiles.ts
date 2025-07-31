// src/api/historiqueFiles.ts 
// API pour l'historique des fichiers

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
    await fetch('http://localhost:5000/api/historiques', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fiche_id: ficheId,
        action,
        actor_id: actorId,
        actor_name: actorName,
        commentaire,
        metadata
      })
    });
  } catch (error) {
    console.error('Erreur lors de la création du log historique :', error);
  }
};
