// api/sessionAPI.js


//  API pour demarrer une session agent
// Utilise l'API Fetch pour interagir avec le backend
export const startSession = async ({ status, pause_type = null, user_id }) => {
  const userId = user_id || JSON.parse(localStorage.getItem('user'))?.id;
  if (!userId || !status) {
    console.error("Utilisateur ou status manquant");
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/session_agents/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        status,
        pause_type,
        start_time: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Erreur serveur au démarrage de session');
    }

    const data = await response.json();
    console.log('✅ Session démarrée:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors du démarrage de session :', error.message);
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
    const response = await fetch('http://localhost:5000/api/session_agents/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Erreur serveur à la fermeture de session');
    }

    const data = await response.json();
    console.log('✅ Session fermée:', data);

    // 🔹 Mettre à jour localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      localStorage.setItem('dernierStatus', 'Hors Ligne'); // ou Hors ligne
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de session :', error.message);
  }
};
