const express = require('express');
const router = express.Router();
const db = require('../db'); // Connexion PostgreSQL
const filesControllers = require('../controllers/filesControllers');
const auth = require('../middlewares/authMiddleware')


// Récupérer toutes les fiches
router.get('/', async (req, res) => { // => GET    /api/files
  try {
    const result = await db.query('SELECT * FROM files ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des fiches :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Point d’entrée logique : /api/files

// Routes GET : récupération des données
router.get('/rendezvous/upcoming/:agentId', filesControllers.getUpcomingRendezVous); // Récupère les rendez-vous à venir pour un agent spécifique // Méthode : GET /api/files/rendezvous/upcoming/:agentId
router.get('/today-summary', auth, filesControllers.getNewFilesCountByAgent); // Récupère le résumé des nouvelles fiches assignées au agent connecté pour la journée en cours // Méthode : GET /api/files/today-summary
router.get('/admin-summary', auth, filesControllers.getAdminFilesSummary); // Récupère le résumé global des nouvelles fiches pour l'administration // Méthode : GET /api/files/admin-summary
router.get('/files-by-agents', auth, filesControllers.getFilesbyAgent); // Récupère toutes les fiches assignées à chaque agent (par agent)        // Méthode : GET /api/files/files_by_agents
router.get('/all_files', filesControllers.getAllFiches); // Récupère toutes les fiches enregistrées dans la base de données, sans filtre    // Méthode : GET /api/files/all_files
router.get('/export_files', filesControllers.exportFichesToXLSX);// Exporte les fiches au format XLSX pour téléchargement ou traitement externe // Méthode : GET /api/files/export_files

// Routes PUT : modification de données
router.put('/:id/traiter', filesControllers.traiterFiche); // Met à jour le statut d'une fiche à "traitée" selon l'ID fourni               // Méthode : PUT /api/files/:id/traiter
router.put('/:id/annuler', filesControllers.annulerFiche); // Annule une fiche identifiée par son ID, modifiant son statut en conséquence  // Méthode : PUT /api/files/:id/annuler
router.put('/:id/cloturer', filesControllers.cloturerFiche); // Clôture une fiche spécifique via son ID, finalisant son traitementMéthode  // Methode : PUT /api/files/:id/cloturer
router.put('/:id/enregistrer', filesControllers.enregistrerFicheSansCloture); // Enregistrer un commentaire pour un tag NRP // Methode : PUT /api/files/:id/enregistrer
router.put('/:id/programmer-rdv', filesControllers.programRdv, filesControllers.getFilesToRDV); // Programme un rendez-vous pour une fiche donnée puis récupère les fiches associées au rendez-vous // Méthode : PUT /api/files/:id/programmer-rdv
router.put('/assigned_To', auth, filesControllers.getAssignedFichesTo); // Récupère les fiches assignées à l'agent connecté (ou autre selon le corps de requête) // Méthode : PUT /api/files/assigned_To
router.put('/import_files', auth, filesControllers.importFiles); // Importe des fiches dans la base de données à partir d'une source externe ou fichier // Méthode : PUT /api/files/import_files
router.put('/unassign', auth, filesControllers.unassignFiches) // Désassigne une fiche déja assigner a un agent et remet la fiche dans le statut nouvelle
router.delete('/:id/delete', auth, filesControllers.deleteFile) // Supprime une fiche spécifique via son ID // Méthode : DELETE /api/files/:id/delete
router.delete('/delete-batch', auth, filesControllers.deleteFilesBatch) // Supprime plusieurs fiches via leurs IDs // Méthode : DELETE /api/files/:id/delete
 
module.exports = router;