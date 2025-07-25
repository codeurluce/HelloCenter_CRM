import axios from 'axios';

export const saveSessionToDB = async ({ user_id, status, startTime, endTime }) => {
  try {
    console.log('Enregistrement session en cours...', { user_id, status, startTime, endTime });
    
    const response = await fetch('http://localhost:5000/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        status,
        start_time: startTime,
        end_time: endTime,
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
