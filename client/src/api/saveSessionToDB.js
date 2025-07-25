export const saveSessionToDB = async ({ status, startTime, endTime, user_id }) => {
  const userId = user_id || JSON.parse(localStorage.getItem('user'))?.id;

  if (!userId) {
    console.error("Utilisateur non connecté");
    return;
  }

  const durationCalc = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
  const duration = durationCalc > 0 ? durationCalc : null;

  try {
    const response = await fetch('http://localhost:5000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        status,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        duration
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Erreur serveur');
    }

    const savedSession = await response.json();
    console.log('✅ Session enregistrée :', savedSession);
  } catch (error) {
    console.error('❌ Erreur enregistrement session :', error.message);
  }
};
