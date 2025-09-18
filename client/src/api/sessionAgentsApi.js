import axiosInstance from "./axiosInstance";

export const updateSession = async (email, newStatus) => {
  try {
    const response = await axiosInstance.post('/sessions/update', {
        email,
        status: newStatus,
    });

    console.log('✅ Statut mis à jour avec succès :',  response.data.message);
    return true;
  } catch (err) {
   const errorMessage = err.response?.data?.message || err.message;
    console.error('❌ Erreur lors de la mise à jour de session :', errorMessage);
    return false;
  }
};
