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