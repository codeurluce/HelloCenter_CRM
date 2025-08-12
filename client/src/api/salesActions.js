import axiosInstance from "./axiosInstance";

// 🔹 Récupérer toutes les ventes
export const getSales = async () => {
  try {
    const res = await axiosInstance.get("/sales");
    return res.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des ventes :", error);
    throw error;
  }
};

// 🔹 Récupérer une vente par ID
export const getSaleById = async (saleId) => {
  try {
    const res = await axiosInstance.get(`/sales/${saleId}`);
    return res.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la vente ID ${saleId} :`, error);
    throw error;
  }
};

// 🔹 Mettre à jour une vente
export const updateSale = async (id, saleData) => {
  try {
    const res = await axiosInstance.put(`/sales/${id}`, saleData);
    return res.data;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la vente ID ${id} :`, error);
    throw error;
  }
};

// 🔹 Supprimer une vente
export const deleteSale = async (id) => {
  try {
    const res = await axiosInstance.delete(`/sales/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Erreur lors de la suppression de la vente ID ${id} :`, error);
    throw error;
  }
};
