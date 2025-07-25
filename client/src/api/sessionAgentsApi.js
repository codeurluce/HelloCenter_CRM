export const updateSession = async (email, newStatus) => {
  try {
    const response = await fetch('http://localhost:5000/api/sessions/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        status: newStatus,
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message);

    console.log('✅ Statut mis à jour avec succès :', data.message);
    return true;
  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour de session :', err.message);
    return false;
  }
};
