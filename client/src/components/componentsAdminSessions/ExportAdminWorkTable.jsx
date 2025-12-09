// src/componentsAdminRH/ExportSessionsModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { X, Download, Calendar, Users, FileText, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import axiosInstance from "../../api/axiosInstance";

dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);

const columnOptions = [
    { key: "date", label: "Date" },
    { key: "agent", label: "Agent" },

    // 🔹 Connexion / déconnexion réelles (depuis agent_connections_history)
    { key: "arrival_time", label: "Heure d'arrivée" },
    { key: "departure_time", label: "Heure de départ" },

    // 🔹 Bornes selon les statuts (session_agents)
    { key: "status_first_start", label: "Connexion" },
    { key: "status_last_end", label: "Déconnexion" },

    // Durées
    { key: "travail", label: "Travail (h)" },
    { key: "pauses", label: "Pauses (h)" },
    { key: "cumul", label: "Cumul (h)" },
];

export default function ExportAdminWorkTable({
    isOpen,
    onClose,
    // optional: si parent fournit déjà une liste agents, tu peux la passer. Sinon le modal la récupère.
    agents: initialAgents = null,
}) {
    const [agents, setAgents] = useState(initialAgents || []);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
    const [agentSearchTerm, setAgentSearchTerm] = useState("");

    const [selectedColumns, setSelectedColumns] = useState([]);
    const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
    const [columnSearchTerm, setColumnSearchTerm] = useState("");

    const [dateType, setDateType] = useState("range"); // "single" ou "range"
    const [singleDate, setSingleDate] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loadingAgents, setLoadingAgents] = useState(false);
    const [exporting, setExporting] = useState(false);

    const agentDropdownRef = useRef(null);
    const columnDropdownRef = useRef(null);

    // Si le parent n'a pas fourni les agents, on va les récupérer
    useEffect(() => {
        const fetchAgents = async () => {
            if (initialAgents && Array.isArray(initialAgents) && initialAgents.length) return;
            try {
                setLoadingAgents(true);
                const res = await axiosInstance.get("/users"); // adapte si ton endpoint est différent
                // transformer en {id, name}
                const list = (res.data || []).map((u) => ({ id: u.id, name: `${u.firstname} ${u.lastname}` }));
                setAgents(list);
            } catch (err) {
                console.error("Erreur récupération agents:", err);
                setAgents([]); // fallback
            } finally {
                setLoadingAgents(false);
            }
        };
        fetchAgents();
    }, [initialAgents]);

    // fermeture dropdowns au clic hors
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (agentDropdownRef.current && !agentDropdownRef.current.contains(e.target)) {
                setAgentDropdownOpen(false);
                setAgentSearchTerm("");
            }
            if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target)) {
                setColumnDropdownOpen(false);
                setColumnSearchTerm("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // filtres simples
    const filteredAgents = agents.filter((a) =>
        a.name.toLowerCase().includes(agentSearchTerm.toLowerCase())
    );
    const filteredColumns = columnOptions.filter((c) =>
        c.label.toLowerCase().includes(columnSearchTerm.toLowerCase())
    );

    // select / deselect agents
    const handleAgentSelect = (agent) => {
        if (!selectedAgents.find((a) => a.id === agent.id)) {
            setSelectedAgents([...selectedAgents, agent]);
        }
    };
    const handleAgentRemove = (id) => setSelectedAgents(selectedAgents.filter((a) => a.id !== id));
    const selectAllAgents = () => setSelectedAgents([...agents]);
    const deselectAllAgents = () => setSelectedAgents([]);

    // select / deselect columns
    const handleColumnSelect = (col) => {
        if (!selectedColumns.find((c) => c.key === col.key)) {
            setSelectedColumns([...selectedColumns, col]);
        }
    };
    const handleColumnRemove = (key) => setSelectedColumns(selectedColumns.filter((c) => c.key !== key));
    const selectAllColumns = () => setSelectedColumns([...columnOptions]);
    const deselectAllColumns = () => setSelectedColumns([]);

    const validateDates = () => {
        if (dateType === "single") {
            return !!singleDate;
        } else {
            if (!startDate || !endDate) return false;
            return dayjs(startDate).isSameOrBefore(dayjs(endDate));
        }
    };

    const handleExport = async () => {
        if (selectedColumns.length === 0) return alert("Sélectionne au moins une colonne.");
        if (!validateDates()) return alert("Sélectionne une période valide.");

        // préparer params
        const sDate = dateType === "single" ? singleDate : startDate;
        const eDate = dateType === "single" ? singleDate : endDate;
        const userIds = selectedAgents.length ? selectedAgents.map((a) => a.id) : [];

        try {
            setExporting(true);

            // appeler la route d'export backend (tu as précisé /session_agents/export-sessions-rh)
            const params = {
                startDate: sDate,
                endDate: eDate,
            };
            if (userIds.length) params.userIds = userIds; // axios encode correctement un tableau

            const res = await axiosInstance.get('/session_agents/export-session-rh', {
                params,
                // si ton backend attend JSON.stringify(userIds), adapte ici
                paramsSerializer: (p) => {
                    // simple serializer qui laisse axios faire son job pour userIds
                    return Object.keys(p)
                        .map((k) => {
                            if (Array.isArray(p[k])) return p[k].map((v) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
                            return `${encodeURIComponent(k)}=${encodeURIComponent(p[k])}`;
                        })
                        .join("&");
                },
            });

            let rows = res.data || [];
            if (!rows.length) {
                alert("Aucune session ne correspond aux critères choisis.");
                setExporting(false);
                return;
            }

            // 🔹 Trier par date ASC pour calcul cumul
            rows = [...rows].sort((a, b) => {
                const agentA = `${a.lastname || ""} ${a.firstname || ""}`.toLowerCase();
                const agentB = `${b.lastname || ""} ${b.firstname || ""}`.toLowerCase();

                if (agentA < agentB) return -1;
                if (agentA > agentB) return 1;

                // si même agent, on trie par date
                return dayjs(a.session_date).isAfter(dayjs(b.session_date)) ? 1 : -1;
            });

            // 🔹 Calcul cumul par agent
            const exportCumulMap = {};
            const exportData = rows.map((r) => {
                const row = {};
                selectedColumns.forEach((col) => {
                    switch (col.key) {
                        case "date":
                            row[col.label] = r.session_date ? dayjs(r.session_date).format("YYYY-MM-DD") : "";
                            break;
                        case "agent":
                            row[col.label] = `${r.firstname || ""} ${r.lastname || ""}`.trim();
                            break;
                        case "arrival_time":
                            row[col.label] = r.arrival_time ? dayjs(r.arrival_time).format("YYYY-MM-DD HH:mm:ss") : "";
                            break;
                        case "departure_time":
                            row[col.label] = r.departure_time ? dayjs(r.departure_time).format("YYYY-MM-DD HH:mm:ss") : "";
                            break;
                        case "status_first_start":
                            row[col.label] = r.status_first_start ? dayjs(r.status_first_start).format("YYYY-MM-DD HH:mm:ss") : "";
                            break;
                        case "status_last_end":
                            row[col.label] = r.status_last_end ? dayjs(r.status_last_end).format("YYYY-MM-DD HH:mm:ss") : "";
                            break;
                        case "travail":
                            row[col.label] = r.travail ? parseFloat((r.travail / 3600).toFixed(2)) : 0;
                            break;
                        case "pauses":
                            row[col.label] = r.pauses ? parseFloat((r.pauses / 3600).toFixed(2)) : 0;
                            break;
                        case "cumul": {
                            // clé agent + mois
                            const monthKey = `${r.firstname} ${r.lastname}-${dayjs(r.session_date).format("YYYY-MM")}`;
                            const travailH = r.travail ? r.travail / 3600 : 0;
                            if (!exportCumulMap[monthKey]) exportCumulMap[monthKey] = 0;
                            exportCumulMap[monthKey] += travailH;

                            row[col.label] = parseFloat(exportCumulMap[monthKey].toFixed(2));
                        }
                            break;

                        default:
                            row[col.label] = r[col.key] ?? "";
                    }
                });
                return row;
            });

            // generate xlsx
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sessions");
            const filename = `sessions_export_${sDate}_${eDate}.xlsx`;
            XLSX.writeFile(wb, filename, { cellStyles: true });

            onClose();
        } catch (err) {
            console.error("Erreur export sessions:", err);
            alert("Erreur pendant l'export. Regarde la console.");
        } finally {
            setExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex bg-blue-600 items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <Download className="h-6 w-6 text-white" />
                        <div>
                            <h2 className="text-xl font-semibold text-white">Exporter les sessions agents</h2>
                            <p className="text-sm text-blue-100">Choisissez agents, période et colonnes</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-lg transition-colors" aria-label="Fermer">
                        <X className="h-5 w-5 text-white" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Agents */}
                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2"><Users className="h-5 w-5" /> Agents</h3>

                        <div className="mt-2 flex gap-3">
                            <button type="button" onClick={selectAllAgents} className="text-sm text-green-600 hover:underline">Tout sélectionner</button>
                            <button type="button" onClick={deselectAllAgents} className="text-sm text-red-600 hover:underline">Tout désélectionner</button>
                        </div>

                        {selectedAgents.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedAgents.map((a) => (
                                    <div key={a.id} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                        <span>{a.name}</span>
                                        <button onClick={() => handleAgentRemove(a.id)} className="ml-2 hover:bg-blue-200 rounded-full p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative mt-3" ref={agentDropdownRef}>
                            <div onClick={() => setAgentDropdownOpen(!agentDropdownOpen)} className="px-4 py-3 border rounded-lg cursor-pointer flex justify-between items-center">
                                <span className="text-gray-500">Choisir agents...</span>
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${agentDropdownOpen ? "rotate-180" : ""}`} />
                            </div>

                            {agentDropdownOpen && (
                                <div className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                                    <div className="p-2 border-b">
                                        <input type="text" placeholder="Rechercher agent..." value={agentSearchTerm} onChange={(e) => setAgentSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                    </div>

                                    {loadingAgents ? (
                                        <div className="p-4 text-center text-gray-500">Chargement agents...</div>
                                    ) : (
                                        filteredAgents.map((a) => (
                                            <div key={a.id} onClick={() => handleAgentSelect(a)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                                {a.name}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2"><Calendar className="h-5 w-5" /> Période</h3>
                        <div className="mt-2 flex gap-6">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="dateType" value="single" checked={dateType === "single"} onChange={(e) => setDateType(e.target.value)} />
                                Date unique
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" name="dateType" value="range" checked={dateType === "range"} onChange={(e) => setDateType(e.target.value)} />
                                Intervalle
                            </label>
                        </div>

                        {dateType === "single" ? (
                            <input type="date" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} className="mt-3 px-3 py-2 border rounded-lg" />
                        ) : (
                            <div className="mt-3 flex gap-3">
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
                            </div>
                        )}
                    </div>

                    {/* Colonnes */}
                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2"><FileText className="h-5 w-5" /> Colonnes</h3>

                        <div className="mt-2 flex gap-3">
                            <button type="button" onClick={selectAllColumns} className="text-sm text-green-600 hover:underline">Tout sélectionner</button>
                            <button type="button" onClick={deselectAllColumns} className="text-sm text-red-600 hover:underline">Tout désélectionner</button>
                        </div>

                        {selectedColumns.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedColumns.map((c) => (
                                    <div key={c.key} className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                        <span>{c.label}</span>
                                        <button onClick={() => handleColumnRemove(c.key)} className="ml-2 hover:bg-green-200 rounded-full p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative mt-3" ref={columnDropdownRef}>
                            <div onClick={() => setColumnDropdownOpen(!columnDropdownOpen)} className="px-4 py-3 border rounded-lg cursor-pointer flex justify-between items-center">
                                <span className="text-gray-500">Choisir colonnes...</span>
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${columnDropdownOpen ? "rotate-180" : ""}`} />
                            </div>

                            {columnDropdownOpen && (
                                <div className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                                    <div className="p-2 border-b">
                                        <input type="text" placeholder="Rechercher colonne..." value={columnSearchTerm} onChange={(e) => setColumnSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                    </div>

                                    {filteredColumns.map((c) => (
                                        <div key={c.key} onClick={() => handleColumnSelect(c)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                            {c.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <div className="text-sm text-gray-500">
                        {selectedAgents.length} agent(s) • {selectedColumns.length} colonne(s)
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} disabled={exporting} className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Annuler</button>
                        <button
                            onClick={handleExport}
                            disabled={exporting || selectedColumns.length === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {exporting ? "Export en cours..." : "Exporter"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
