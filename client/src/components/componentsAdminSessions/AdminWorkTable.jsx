import React, { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import axiosInstance from "../../api/axiosInstance";
import CorrectionModal from "./CorrectionModal";
import { RefreshCw, Upload } from "lucide-react";
import ExportAdminWorkTable from "./ExportAdminWorkTable";

// Convertir secondes en heures décimales
const secondsToDecimal = (seconds) => {
    if (!seconds || seconds <= 0) return 0;
    return +(seconds / 3600).toFixed(2);
};

export default function AdminWorkTable() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");
    const [searchAgent, setSearchAgent] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "session_date", direction: "desc" });
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [exportModalOpen, setExportModalOpen] = useState(false);

    const today = dayjs().format("YYYY-MM-DD");
    const firstDay = dayjs().startOf("month").format("YYYY-MM-DD");

    const fetchData = async () => {
        setLoading(true);
        const start = filterStart || firstDay;
        const end = filterEnd || today;

        try {
            const { data } = await axiosInstance.get("/session_agents/agents-session-rh", {
                params: { startDate: start, endDate: end },
            });
            setData(data);
        } catch (e) {
            console.error("Erreur chargement admin hours:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetFilters = () => {
        setFilterStart("");
        setFilterEnd("");
        setSearchAgent("");
        fetchData();
    };

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
        setSortConfig({ key, direction });
    };

    const processedData = useMemo(() => {
        let filtered = [...data];

        // Recherche live sur agent
        if (searchAgent.trim()) {
            filtered = filtered.filter((d) =>
                `${d.firstname} ${d.lastname}`.toLowerCase().includes(searchAgent.toLowerCase())
            );
        }

        // 🔥 Trier d'abord par date ASC pour le calcul du cumul
        const cumulMap = {};
        const cumulData = [...filtered]
            .sort((a, b) => dayjs(a.session_date).isAfter(dayjs(b.session_date)) ? 1 : -1)
            .map(d => {
                const key = `${d.firstname} ${d.lastname}`;
                const travailHeures = secondsToDecimal(d.travail);

                if (!cumulMap[key]) cumulMap[key] = 0;
                cumulMap[key] += travailHeures;

                return { ...d, cumul: cumulMap[key] };
            });

        // 🔥 Ensuite, appliquer l'ordre d'affichage (asc/desc)
        return sortConfig.direction === "asc" ? cumulData : [...cumulData].reverse();

    }, [data, searchAgent, sortConfig]);


    return (
        <div className="p-6 bg-white rounded-xl shadow mt-10">
            <h2 className="text-xl font-semibold mb-4">📊 Heures de travail – Agents</h2>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 mb-5 items-end">
                <div>
                    <label className="block text-sm font-medium">Date début</label>
                    <input
                        type="date"
                        value={filterStart}
                        onChange={(e) => setFilterStart(e.target.value)}
                        className="border px-3 py-2 rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Date fin</label>
                    <input
                        type="date"
                        value={filterEnd}
                        onChange={(e) => setFilterEnd(e.target.value)}
                        className="border px-3 py-2 rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Chercher un agent</label>
                    <input
                        type="text"
                        value={searchAgent}
                        onChange={(e) => setSearchAgent(e.target.value)}
                        placeholder="Prénom ou Nom"
                        className="border px-3 py-2 rounded"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Appliquer
                    </button>
                    <button
                        onClick={resetFilters}
                        className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Reset
                    </button>
                </div>
                <button
                    onClick={fetchData}
                    className="flex ml-auto items-center gap-2 py-2 px-4 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition"
                >
                    <RefreshCw size={16} /> Rafraîchir
                </button>
                <button
                    onClick={() => setExportModalOpen(true)}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 gap-2 rounded-lg transition-colors font-medium shadow-sm"
                >
                    <Upload size={16} /> Exporter
                </button>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border cursor-pointer" onClick={() => requestSort("session_date")}>
                                Date {sortConfig.key === "session_date" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                            </th>
                            <th className="p-2 border cursor-pointer" onClick={() => requestSort("agent")}>Agent</th>
                            <th className="p-2 border cursor-pointer" onClick={() => requestSort("start_time")}>Connexion</th>
                            <th className="p-2 border cursor-pointer" onClick={() => requestSort("end_time")}>Déconnexion</th>
                            <th className="p-2 border cursor-pointer" onClick={() => requestSort("travail")}>Travail (h)</th>
                            <th className="p-2 border cursor-pointer" onClick={() => requestSort("pauses")}>Pauses (h)</th>
                            <th className="p-2 border cursor-pointer" onClick={() => requestSort("cumul")}>Cumul (h)</th>
                            <th className="p-2 border">Action</th>
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
                        ) : processedData.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center py-6 text-gray-500 italic">
                                    Aucune donnée pour cette période
                                </td>
                            </tr>
                        ) : (

                            processedData.map((row, index) => (
                                <tr key={row.id ?? `${row.user_id}-${index}`} className="hover:bg-gray-50">
                                    <td className="p-2 border">{String(row.session_date).split("T")[0]}</td>
                                    <td className="p-2 border font-semibold">{row.lastname} {row.firstname}</td>
                                    <td className="p-2 border font-mono">{row.start_time ? dayjs(row.start_time).format("YYYY-MM-DD HH:mm:ss") : "--"}</td>
                                    <td className="p-2 border font-mono">{row.end_time ? dayjs(row.end_time).format("YYYY-MM-DD HH:mm:ss") : "--"}</td>
                                    <td className="p-2 border font-mono">{secondsToDecimal(row.travail)}</td>
                                    <td className="p-2 border font-mono">{secondsToDecimal(row.pauses)}</td>
                                    <td className="p-2 border font-mono">{row.cumul.toFixed(2)}</td>
                                    <td className="p-2 border text-center">
                                        <button
                                            className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-xs"
                                            onClick={() => {
                                                setSelectedRow(row);
                                                setModalOpen(true);
                                            }}
                                        >
                                            Corriger
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <CorrectionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                row={selectedRow}
                onSaved={fetchData}
            />
            <ExportAdminWorkTable
                isOpen={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                sessions={data}        // ici tu passes les sessions déjà chargées
                agents={Array.from(new Map(data.map(d => [d.user_id, { id: d.user_id, name: `${d.firstname} ${d.lastname}` }])).values())} // déduplique les agents
            />
        </div>
    );
}