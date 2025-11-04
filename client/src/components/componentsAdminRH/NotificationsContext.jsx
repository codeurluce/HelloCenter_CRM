// src/components/componentsAdminRH/NotificationsContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [finContratNotifs, setFinContratNotifs] = useState([]); // notifications fin contrat
  const [loading, setLoading] = useState(true);

  // 🔹 Charger automatiquement les notifications à l’ouverture
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axiosInstance.get("/rh/notifications/fin-contrat");
        console.log("Res API:", res.data);
        setFinContratNotifs(res.data || []);
      } catch (err) {
        console.error("Erreur chargement notifications fin contrat:", err);
        // 🔸 fallback pour test local
        setFinContratNotifs([
          {
            id: 1,
            nom: "Alice Durand",
            type_contrat: "CDD",
            date_fin: "2025-11-15",
            jours_restant: 12,
            lu: false,
          },
          {
            id: 2,
            nom: "Karim Ndiaye",
            type_contrat: "Stage",
            date_fin: "2025-11-05",
            jours_restant: 2,
            lu: false,
          },
          {
            id: 3,
            nom: "Sophie Leroy",
            type_contrat: "CDI",
            date_fin: "2025-12-10",
            jours_restant: 37,
            lu: true,
          },
        ]);
      } finally {
        setLoading(false); // ✅ on indique que le chargement est fini
      }
    };

    fetchNotifications();
  }, []);

  // 🔹 Marquer une notif comme lue
  const markAsRead = async (id) => {
    try {
      const res = await axiosInstance.patch(`/rh/notifications/${id}/lu`);
      if (res.data.success && res.data.notification) {
        setFinContratNotifs((prev) =>
          prev.map((n) => (n.id === id ? res.data.notification : n))
        );
      } else {
        // fallback local
        setFinContratNotifs((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
        );
      }
    } catch (err) {
      console.error("Erreur lors du marquage de notification:", err);
      // fallback local
      setFinContratNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
      );
    }
  };

  const unreadCount = finContratNotifs.filter((n) => !n.lu).length;


  return (
    <NotificationsContext.Provider
      value={{ finContratNotifs, setFinContratNotifs, markAsRead, unreadCount, loading }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
