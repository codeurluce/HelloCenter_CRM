/**
 * 📄 getCurrentUser.js
 * ---------------------------------------------
 * Ce module contient une fonction utilitaire permettant 
 * de récupérer les informations de l'utilisateur connecté 
 * via une requête API sécurisée.
 *
 * - Utilise axiosInstance (instance configurée d’Axios avec baseURL + headers)
 * - Gère automatiquement les erreurs de connexion ou d’authentification
 * ---------------------------------------------
 */

import axiosInstance from "./axiosInstance";

export const getCurrentUser = async () => {
  try {
    const { data } = await axiosInstance.get("/me");
    return data;
  } catch (error) {
    console.error("Erreur récupération utilisateur :", error);
    return null;
  }
};