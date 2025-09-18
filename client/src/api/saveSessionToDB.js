// api/sessionAPI.js

//  API pour demarrer une session agent
// Utilise l'API Fetch pour interagir avec le backend
import axiosInstance from "./axiosInstance";

export const startSession = async ({ status, pause_type = null, user_id }) => {

  const userId = user_id || JSON.parse(localStorage.getItem('user'))?.id;

  if (!userId || !status) {
    console.error("Utilisateur ou status manquant");
    return;
  }

  try {
    const response = await axiosInstance.post('/session_agents/start', {
        user_id: userId,
        status,
        pause_type,
        start_time: new Date().toISOString(),
    });

    console.log('✅ Session démarrée:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors du démarrage de session :',  error.response?.data || error.message);
     throw error;
  }
};

// API pour fermer la session agent
// Utilise l'API Fetch pour interagir avec le backend
export const closeSession = async ({ user_id }) => {
  const userId = user_id || JSON.parse(localStorage.getItem('user'))?.id;
  if (!userId) {
    console.error("Utilisateur manquant");
    return;
  }

  try {
    const response = await axiosInstance.post('/session_agents/close', {
       user_id: userId,
    });

    console.log('✅ Session fermée:', response.data);

    // 🔹 Mettre à jour localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      localStorage.setItem('dernierStatus', 'Hors Ligne'); // ou Hors ligne
    }

    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de session :',error.response?.data || error.message);
     throw error;
  }
};
