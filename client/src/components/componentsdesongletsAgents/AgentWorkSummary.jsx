import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import axiosInstance from "../../api/axiosInstance";

// Utilitaire format HH:mm
const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function AgentWorkSummary({ userId }) {

    const [todayWork, setTodayWork] = useState(6 * 3600);
    const [monthWork, setMonthWork] = useState(120 * 3600);

    const [autoHistory, setAutoHistory] = useState([]); // Historique auto (J−1, J−2…)

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


    const secondsToDecimalHours = (sec) => {
        if (!sec || sec <= 0) return 0;
        const hours = sec / 3600;
        return Number(hours.toFixed(2)); // arrondi propre
    };

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data } = await axiosInstance.get("/session_agents/monthly");

                // Calcul cumul et today/month totals
                let cumul = 0;
                const hist = data.map((d) => {
                    const travail = Number(d.travail) || 0;
                    const pauses = Number(d.pauses) || 0;
                    const indispo = Number(d.indispo) || 0;

                    cumul += travail;

                    return {
                        date: d.session_date,
                        travail,
                        pauses,
                        indispo,
                        presence: Number(d.presence) || 0,
                        cumul_travail: cumul,
                    };
                });

                setAutoHistory(hist);

                // Aujourd'hui
                const today = hist.find(h => dayjs(h.date).isSame(dayjs(), "day"));
                setTodayWork(today ? today.travail : 0);

                // Cumul du mois
                setMonthWork(cumul);

            } catch (err) {
                console.error("Erreur récupération sessions :", err);
            }
        };

        fetchSessions();
    }, []);

    const fetchHistorique = () => {
        if (!filterStart) return;

        const start = dayjs(filterStart);
        const end = filterEnd ? dayjs(filterEnd) : start;

        const result = autoHistory.filter((d) => {
            const dDate = dayjs(d.date);
            return dDate.isAfter(start.subtract(1, "day")) && dDate.isBefore(end.add(1, "day"));
        });

        setHistorique(result);

        let tot = 0;
        result.forEach((d) => (tot += d.travail));
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
                        <th className="p-2 border">Date</th>
                        <th className="p-2 border">Travail</th>
                        <th className="p-2 border">Cumul jusque là</th>
                    </tr>
                </thead>
                <tbody>
                    {autoHistory.map((h, index) => {

                        return (
                            <tr key={h.date}>
                                <td className="p-2 border">{formatDate(h.date)}</td>
                                <td className="p-2 border font-mono">{formatTime(h.travail)}</td>
                                <td className="p-2 border font-mono font-bold">{secondsToDecimalHours(h.cumul_travail)}</td>
                            </tr>
                        );
                    })}
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
                                <th className="p-2 border">Présence </th>
                            </tr>
                        </thead>
                        <tbody>
                            {historique.map((h) => (
                                <tr key={h.date}>
                                    <td className="p-2 border">{formatDate(h.date)}</td>
                                    <td className="p-2 border font-mono font-bold">{formatTime(h.travail)}</td>
                                    <td className="p-2 border font-mono">{formatTime(h.pauses)}</td>
                                    <td className="p-2 border font-mono">{formatTime(h.cumul_travail)}</td>

                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end">
                        <div className="mt-4 p-2 bg-red-50 rounded-lg text-center ml-auto w-max">
                            <div className="text-xs text-orange-700">Total période filtrée (heure de travail)</div>
                            <div className="text-lg font-mono">{formatTime(totalPeriode)}</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}