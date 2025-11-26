import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import axiosInstance from "../../api/axiosInstance";

// format HH:mm:ss (inchangé)
const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// Convertit secondes -> format H,MM (ex: 5h30 => "5,30")
// Règle : arrondir les secondes en minutes (si fraction de minute >= 0.5 on arrondit vers le haut)
const formatHoursWithRoundedMinutes = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return "0,00";
    let hours = Math.floor(totalSeconds / 3600);
    // minutes fraction before rounding
    const remainingSeconds = totalSeconds % 3600;
    const minutesFloat = remainingSeconds / 60; // ex 30.333...
    const minutesRounded = Math.round(minutesFloat); // arrondi normal (.5 -> up)

    // si minutesRounded === 60, on incrémente l'heure
    if (minutesRounded === 60) {
        hours += 1;
        return `${hours},00`;
    }
    // format minutes with two digits
    return `${hours},${String(minutesRounded).padStart(2, "0")}`;
};

// Pour l'affichage du cumul en table (on garde cumul_travail en secondes côté back)
const secondsToDecimalHours = (sec) => {
    if (!sec || sec <= 0) return 0;
    const hours = sec / 3600;
    return Number(hours.toFixed(2)); // si tu veux garder le cumul du mois sous forme décimale
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

    useEffect(() => {
        const fetchSessions = async () => {
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
            }
        };

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

    const fetchHistorique = () => {
        if (!filterStart) return;

        const start = dayjs(filterStart);
        const end = filterEnd ? dayjs(filterEnd) : start;

        const result = autoHistory.filter((d) => {
            const dDate = dayjs(d.session_date);
            return dDate.isAfter(start.subtract(1, "day")) && dDate.isBefore(end.add(1, "day"));
        });

        // on retourne le résultat trié selon sortOrder aussi
        const sorted = result.sort((a, b) => {
            const da = dayjs(a.session_date);
            const db = dayjs(b.session_date);
            if (sortOrder === "desc") return db.isAfter(da) ? 1 : (db.isBefore(da) ? -1 : 0);
            return da.isAfter(db) ? 1 : (da.isBefore(db) ? -1 : 0);
        });

        setHistorique(sorted);

        let tot = 0;
        result.forEach((d) => (tot += Number(d.travail || 0)));
        setTotalPeriode(tot);
    };

    return (
        <div className="mt-10 p-5 bg-white rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4 text-center">
                📅 Heures de travail – Aujourd’hui / Mois / Historique / Filtres
            </h2>

            {/* Résumé */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-sm text-blue-600">Aujourd’hui</div>
                    <div className="text-xl font-mono">{formatTime(todayWork)}</div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-sm text-green-700">Cumul du mois</div>
                    <div className="text-xl font-mono">{secondsToDecimalHours(monthWork)}</div>
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
                    {sortedAutoHistory.map((h) => (
                        <tr key={h.session_date}>
                            <td className="p-2 border">{formatDate(h.session_date)}</td>
                            <td className="p-2 border font-mono">{formatTime(Number(h.travail || 0))}</td>
                            <td className="p-2 border font-mono font-bold">
                                {formatHoursWithRoundedMinutes(Number(h.cumul_travail || 0))}
                            </td>
                        </tr>
                    ))}
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
                            {historique.map((h) => (
                                <tr key={h.session_date}>
                                    <td className="p-2 border">{formatDate(h.session_date)}</td>
                                    <td className="p-2 border font-mono font-bold">{formatTime(Number(h.travail || 0))}</td>
                                    <td className="p-2 border font-mono">{formatTime(Number(h.pauses || 0))}</td>
                                    <td className="p-2 border font-mono">{formatTime(Number(h.presence || 0))}</td>
                                    <td className="p-2 border font-mono font-bold">{formatHoursWithRoundedMinutes(Number(h.cumul_travail || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}