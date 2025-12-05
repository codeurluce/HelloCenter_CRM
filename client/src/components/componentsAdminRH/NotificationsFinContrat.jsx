// src/componentsAdminRH/NotificationsFinContrat.jsx
import React, { useState } from "react";
import { BellRing, CheckCircle, Clock, AlertTriangle, X, CircleAlert, CircleMinus } from "lucide-react";
import { useNotifications } from "./NotificationsContext";
import dayjs from "dayjs";

export default function NotificationsFinContrat() {
    const { finContratNotifs, markAsRead, loading } = useNotifications(); // ✅ utiliser le context
    const [filter, setFilter] = useState("tous");
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleOpenNotif = async (notif) => {
        setSelectedNotif(notif);
        setShowModal(true);

        if (!notif.lu) {
            await markAsRead(notif.id); // ✅ mise à jour via context
        }
    };

    const filtered = finContratNotifs.filter((n) => {
        if (filter === "non lus") return !n.lu;
        if (filter === "lus") return n.lu;
        return true;
    });

    const getIcon = (jours) => {
        if (jours === 0) return <CircleMinus className="text-red-600" size={20} />;
        if (jours <= 7) return <AlertTriangle className="text-orange-500" size={20} />;
        return <AlertTriangle className="text-green-500" size={20} />;
    };

    return (
        <div className="p-6 space-y-5 relative">
            {/* Header + filtres */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BellRing className="text-blue-600" /> Notifications Fin de Contrat
                </h1>
                <div className="flex gap-2">
                    {["tous", "non lus", "lus"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-lg border text-sm transition ${filter === f
                                ? "bg-blue-600 text-white border-blue-600"
                                : "border-gray-300 text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Liste notifications */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <span className="text-blue-700 font-medium">Chargement des notifications...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-gray-500 text-sm italic text-center mt-10">
                        Aucune notification.
                    </p>
                ) : (
                    filtered.map((notif) => {
                        return (
                            <div
                                key={notif.id}
                                onClick={() => handleOpenNotif(notif)}
                                className={`flex justify-between items-center p-4 rounded-xl shadow-sm border cursor-pointer transition ${!notif.lu
                                    ? "bg-blue-50 border-blue-100 hover:bg-blue-100"
                                    : "bg-white border-gray-200 hover:bg-gray-100"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {getIcon(notif.jours_restant)}
                                    <div>
                                        <p className="font-semibold text-gray-800">{notif.nom}</p>
                                        <p className="text-sm text-gray-500">
                                            {notif.message} - le {dayjs(notif.date_fin).format("DD/MM/YYYY")}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`text-xs font-medium px-2 py-1 rounded-full ${!notif.lu
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-green-100 text-green-700"
                                        }`}
                                >
                                    {!notif.lu ? "non lu" : "lu"}
                                </span>
                            </div>

                        );
                    })
                )}
            </div>

            {/* Modal notification */}
            {showModal && selectedNotif && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                     onClick={() => setShowModal(false)}
                    >
                    <div className="bg-white rounded-xl shadow-xl w-[400px] p-6 relative animate-fadeIn"
                         onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Détails de la notification
                        </h2>
                        <div className="text-sm text-gray-700 space-y-2">
                            <p><strong>Agent :</strong> {selectedNotif.nom}</p>
                            <p><strong>Type de contrat :</strong> {selectedNotif.type_contrat}</p>
                            <p><strong>Message :</strong> {selectedNotif.message}</p>
                            <p><strong>Date de fin :</strong> {" "} {dayjs(selectedNotif.date_fin).format("DD/MM/YYYY")}</p>
                            <p>
                                <strong>Temps restant :</strong>{" "}
                                {selectedNotif.jours_restant > 0
                                    ? `${selectedNotif.jours_restant} jour${selectedNotif.jours_restant > 1 ? "s" : ""}`
                                    : "Contrat expiré"}
                            </p>
                            <p className="text-gray-500 italic">
                                Cette notification est désormais marquée comme lue.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
