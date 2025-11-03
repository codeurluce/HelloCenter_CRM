import React, { useEffect, useState } from "react";
import { BellRing, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

export default function NotificationsFinContrat() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("tous");

  useEffect(() => {
    // Exemple de simulation d'appel API
    async function fetchNotifications() {
      try {
        const res = await axiosInstance.get("/notifications/fin-contrat");
        setNotifications(res.data);
      } catch (err) {
        console.error("Erreur chargement notifications", err);
        // Données factices pour maquette
        setNotifications([
          {
            id: 1,
            nom: "Alice Durand",
            type_contrat: "CDD",
            date_fin: "2025-11-15",
            jours_restant: 12,
            statut: "non lu",
          },
          {
            id: 2,
            nom: "Karim Ndiaye",
            type_contrat: "Stage",
            date_fin: "2025-11-05",
            jours_restant: 2,
            statut: "non lu",
          },
          {
            id: 3,
            nom: "Sophie Leroy",
            type_contrat: "CDI",
            date_fin: "2025-12-10",
            jours_restant: 37,
            statut: "lu",
          },
        ]);
      }
    }
    fetchNotifications();
  }, []);

  const filtered = notifications.filter((n) => {
    if (filter === "non lus") return n.statut === "non lu";
    if (filter === "lus") return n.statut === "lu";
    return true;
  });

  const getIcon = (jours) => {
    if (jours <= 0) return <AlertTriangle className="text-red-600" size={20} />;
    if (jours <= 7) return <Clock className="text-orange-500" size={20} />;
    return <CheckCircle className="text-green-500" size={20} />;
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BellRing className="text-blue-600" /> Notifications Fin de Contrat
        </h1>
        <div className="flex gap-2">
          {['tous', 'non lus', 'lus'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg border text-sm transition ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center mt-10">
            Aucune notification à afficher.
          </p>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`flex justify-between items-center p-4 rounded-xl shadow-sm border transition ${
                notif.statut === 'non lu' ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'
              } hover:shadow-md`}
            >
              <div className="flex items-center gap-3">
                {getIcon(notif.jours_restant)}
                <div>
                  <p className="font-semibold text-gray-800">{notif.nom}</p>
                  <p className="text-sm text-gray-500">
                    Contrat {notif.type_contrat} - Fin le {notif.date_fin} (
                    {notif.jours_restant > 0
                      ? `dans ${notif.jours_restant} jours`
                      : "expiré"}
                    )
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    notif.statut === 'non lu'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {notif.statut}
                </span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-lg">
                  Notifier RH
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
