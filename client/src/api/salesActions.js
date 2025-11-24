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

// 🔹 Mettre à jour une vente energie
export const updateSale = async (id, saleData) => {
  try {
    const res = await axiosInstance.put(`/sales/energie/${id}`, saleData);
    return res.data;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la vente ID ${id} :`, error);
    throw error;
  }
};

// 🔹 Mettre à jour une vente Offre Mobile
export const updateSaleMobile = async (id, saleData) => {
  try {
    const res = await axiosInstance.put(`/sales/offre-mobile/${id}`, saleData);
    return res.data;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la vente ID ${id} :`, error);
    throw error;
  }
};

// 🔹 Supprimer une vente
export const deleteSale = async (id) => {
  try {
    const res = await axiosInstance.delete(`/sales/${id}/delete`);
    return res.data;
  } catch (error) {
    console.error(`Erreur lors de la suppression de la vente ID ${id} :`, error);
    throw error;
  }
};

// 🔹 Supprimer plusieurs ventes
export const deleteMultipleSales = async (ids) => {
  try {
    const res = await axiosInstance.delete(`/sales/delete-multiple`, {
      data: { ids } // ⚠️ important : DELETE utilise "data"
    });
    return res.data;
  } catch (error) {
    console.error("Erreur suppression multiple :", error);
    throw error;
  }
};

// 🔹 Créer une nouvelle vente
export const createSale = async (saleData) => {
  try {
    const res = await axiosInstance.post("/sales", saleData);
    return res.data;
  } catch (error) {
    console.error("Erreur lors de la création de la vente :", error);
    throw error;
  }
};