import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import axiosInstance from "../../api/axiosInstance";
import { RefreshCw } from "lucide-react";

// format HH:mm:ss (inchangé)
const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// Convertit secondes -> format H,MM (ex: 5h30 => "5,30")
const formatHoursDecimal = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = (totalSeconds % 3600) / 60; // fraction d'heure en minutes
    const decimalHours = hours + minutes / 60;  // convertit les minutes en fraction d'heure
    return Number(decimalHours.toFixed(2));     // arrondi à 2 décimales
};

export default function AgentWorkSummary({ userId }) {
    const [todayWork, setTodayWork] = useState(6 * 3600);
    const [monthWork, setMonthWork] = useState(120 * 3600);

    const [autoHistory, setAutoHistory] = useState([]); // Historique auto (renvoyé par le back)

    // tri côté frontend : 'desc' par défaut (récent en haut)
    const [sortOrder, setSortOrder] = useState("desc");

    // Filtres
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");
    const [historique, setHistorique] = useState([]);
    const [totalPeriode, setTotalPeriode] = useState(0);
    const [loading, setLoading] = useState(false);

    const resetFilters = () => {
        setFilterStart("");
        setFilterEnd("");
        setHistorique([]);
        setTotalPeriode(0);
    };

    const formatDate = (isoString) => {
        if (!isoString) return "";
        return isoString.split("T")[0];
    };


    const fetchSessions = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.get("/session_agents/monthly", {
                params: { userId },
            });

            // data est un array d'objets contenant :
            // session_date, dispo, pauses, indispo, travail, presence, cumul_travail (secs)
            setAutoHistory(data);

            // Trouver aujourd'hui dans les données
            const today = data.find(h => dayjs(h.session_date).isSame(dayjs(), "day"));
            setTodayWork(today ? Number(today.travail) : 0);

            // Calcul cumul du mois (total seconds)
            const cumul = data.reduce((acc, d) => acc + (Number(d.travail) || 0), 0);
            setMonthWork(cumul);

        } catch (err) {
            console.error("Erreur récupération sessions :", err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchSessions();
    }, [userId]);

    // tri local selon sortOrder
    const sortedAutoHistory = [...autoHistory].sort((a, b) => {
        const da = dayjs(a.session_date);
        const db = dayjs(b.session_date);
        if (sortOrder === "desc") return db.isAfter(da) ? 1 : (db.isBefore(da) ? -1 : 0);
        return da.isAfter(db) ? 1 : (da.isBefore(db) ? -1 : 0);
    });

    // toggle sortOrder quand on clique sur l'en-tête Date
    const toggleSort = () => {
        setSortOrder(prev => prev === "desc" ? "asc" : "desc");
    };

    const fetchHistorique = async () => {
        if (!filterStart) return;

        setLoading(true);

        try {
            const { data } = await axiosInstance.get("/session_agents/monthly-filtre", {
                params: {
                    userId,
                    startDate: filterStart,
                    endDate: filterEnd || filterStart,
                },
            });

            setHistorique(data);

            // total periode
            let tot = 0;
            data.forEach((d) => (tot += Number(d.travail || 0)));
            setTotalPeriode(tot);

        } catch (err) {
            console.error("Erreur filtre :", err);
        } finally {
            setLoading(false)
        }
    };

    return (
        <div className="mt-10 p-5 bg-white rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4 text-center">
                📅 Heures de travail – Aujourd’hui / Mois / Historique / Filtres
            </h2>

            <button
                onClick={fetchSessions}
                className="flex ml-auto mb-4 items-center gap-2 py-2 px-4 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition"
            >
                <RefreshCw size={16} /> Rafraîchir
            </button>


            {/* Résumé */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-sm text-blue-600">Aujourd’hui</div>
                    <div className="text-xl font-mono">{formatTime(todayWork)}</div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-sm text-green-700">Cumul du mois</div>
                    <div className="text-xl font-mono">{formatHoursDecimal(monthWork)}</div>
                </div>
            </div>

            {/* === Historique Auto : J-1, J-2, J-3 === */}
            <h3 className="text-md font-semibold mb-2">📌 Jours précédents</h3>

            <table className="w-full text-sm mt-2 border">
                <thead>
                    <tr className="bg-gray-100">
                        <th
                            className="p-2 border cursor-pointer"
                            onClick={toggleSort}
                            title="Cliquer pour inverser l'ordre (asc/desc)"
                        >
                            Date {sortOrder === "desc" ? "↓" : "↑"}
                        </th>
                        <th className="p-2 border">Travail</th>
                        <th className="p-2 border">Cumul jusque là</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="9">
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <span className="text-blue-700 font-medium">Chargement des jours précedents...</span>
                                </div>
                            </td>
                        </tr>
                    ) : sortedAutoHistory.length === 0 ? (
                        <tr>
                            <td colSpan="9" className="text-center py-6 text-gray-500 italic">
                                Aucune donnée pour cette période
                            </td>
                        </tr>
                    ) : (
                        sortedAutoHistory.map((h) => (
                            <tr key={h.session_date}>
                                <td className="p-2 border">{formatDate(h.session_date)}</td>
                                <td className="p-2 border font-mono">{formatTime(Number(h.travail || 0))}</td>
                                <td className="p-2 border font-mono font-bold">
                                    {formatHoursDecimal(Number(h.cumul_travail || 0))}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* === Filtres === */}
            <div className="flex flex-col sm:flex-row items-center gap-3 my-6">
                <input
                    type="date"
                    value={filterStart}
                    onChange={(e) => setFilterStart(e.target.value)}
                    className="border px-3 py-2 rounded"
                />
                <input
                    type="date"
                    value={filterEnd}
                    onChange={(e) => setFilterEnd(e.target.value)}
                    className="border px-3 py-2 rounded"
                />
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={fetchHistorique}
                >
                    Afficher
                </button>
                <button
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                    onClick={resetFilters}
                >
                    Réinitialiser
                </button>
                {historique.length > 0 && (
                    <button
                        onClick={fetchHistorique}
                        className="flex ml-auto items-center gap-2 py-2 px-4 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition"
                    >
                        <RefreshCw size={16} /> Rafraîchir
                    </button>
                )}
            </div>

            {/* Tableau filtré */}
            {historique.length > 0 && (
                <>
                    <table className="w-full text-sm mt-4 border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Date</th>
                                <th className="p-2 border">Travail</th>
                                <th className="p-2 border">Pauses</th>
                                <th className="p-2 border">Présence</th>
                                <th className="p-2 border">Cumul</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9">
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                            <span className="text-blue-700 font-medium">Chargement des sessions...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : historique.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-6 text-gray-500 italic">
                                        Aucune donnée pour cette période
                                    </td>
                                </tr>
                            ) : (
                                historique.map((h) => (
                                    <tr key={h.session_date}>
                                        <td className="p-2 border">{formatDate(h.session_date)}</td>
                                        <td className="p-2 border font-mono font-bold">{formatTime(Number(h.travail || 0))}</td>
                                        <td className="p-2 border font-mono">{formatTime(Number(h.pauses || 0))}</td>
                                        <td className="p-2 border font-mono">{formatTime(Number(h.presence || 0))}</td>
                                        <td className="p-2 border font-mono font-bold">{formatHoursDecimal(Number(h.cumul_travail || 0))}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}