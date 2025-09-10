// src/componentsSales/ExportModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { X, Download, Calendar, Users, FileText, ChevronDown, Search } from "lucide-react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const ExportModal = ({ isOpen, onClose, sales = [] }) => {
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [dateType, setDateType] = useState("single");
    const [singleDate, setSingleDate] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
    const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
    const [agentSearchTerm, setAgentSearchTerm] = useState("");
    const [columnSearchTerm, setColumnSearchTerm] = useState("");
    const agentDropdownRef = useRef(null);
    const columnDropdownRef = useRef(null);

    // ---- Colonnes disponibles ----
    const columnOptions = [
        { key: "product_type", label: "Type_vente" },
        { key: "created_at", label: "Date" },
        { key: "agent", label: "Agent" },
        { key: "ref_client", label: "Réf Client" },
        { key: "ref_contrat", label: "Réf Contrat" },
        { key: "partenaire", label: "Partenaire" },
        { key: "civilite", label: "Civilité" },
        { key: "client", label: "Client" },
        { key: "client_phone", label: "Téléphone mobile" },
        { key: "client_phone_fix", label: "Téléphone fixe" },
        { key: "client_email", label: "Email" },
        { key: "ville_client", label: "Ville" },
        { key: "adresse_client", label: "Adresse" },
        { key: "code_postal_client", label: "Code Postal" },
        { key: "nature_offre", label: "Offre" },
        { key: "energie", label: "Energie" },
        { key: "pdl", label: "PDL" },
        { key: "pce", label: "PCE" },
        { key: "etat_contrat", label: "État contrat" },
        { key: "puissance_compteur", label: "Puissance compteur" },
        { key: "status", label: "Statut vente" },
        { key: "cancelled_reason", label: "commentaire annulation" },
    ];

    // ---- Agents disponibles (dédoublés depuis ventes) ----
    const uniqueAgents = Array.from(
        new Map(
            (sales || [])
                .filter(sale => sale.agent_id) // On garde juste les ventes avec agent_id
                .map(sale => [
                    sale.agent_id,
                    {
                        id: sale.agent_id,
                        name: sale.name_agent || "Inconnu", // On utilise la colonne name_agent
                    },
                ])
        ).values()
    );

    const statusMap = {
        pending: "Vente",
        cancelled: "Annulé",
        validated: "Payée",
    };

    // ---- Filtres dropdown ----
    const filteredAgents = uniqueAgents.filter((a) =>
        a.name.toLowerCase().includes(agentSearchTerm.toLowerCase())
    );

    const filteredColumns = columnOptions.filter((col) =>
        col.label.toLowerCase().includes(columnSearchTerm.toLowerCase())
    );

    // ---- Fermeture dropdowns en clic extérieur ----
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
                setAgentDropdownOpen(false);
                setAgentSearchTerm("");
            }
            if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target)) {
                setColumnDropdownOpen(false);
                setColumnSearchTerm("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ---- Sélection agents ----
    const handleAgentSelect = (agent) => {
        if (!selectedAgents.find((a) => a.id === agent.id)) {
            setSelectedAgents([...selectedAgents, agent]);
        }
        setAgentDropdownOpen(false);
    };

    const handleAgentRemove = (agentId) => {
        setSelectedAgents(selectedAgents.filter((a) => a.id !== agentId));
    };

    // ---- Sélection colonnes ----
    const handleColumnSelect = (col) => {
        if (!selectedColumns.find((c) => c.key === col.key)) {
            setSelectedColumns([...selectedColumns, col]);
        }
        setColumnDropdownOpen(false);
    };

    const handleColumnRemove = (colKey) => {
        setSelectedColumns(selectedColumns.filter((c) => c.key !== colKey));
    };

    // ---- Export ----
    const handleExport = () => {
        let filteredSales = [...sales];

        // Filtre par agent
        if (selectedAgents.length > 0) {
            const ids = selectedAgents.map((a) => a.id);
            filteredSales = filteredSales.filter(
                (s) =>
                    ids.includes(s.agent_id) ||
                    ids.includes(`${s.agent_firstname}-${s.agent_name}`)
            );
        }

        // Filtre par date
        if (dateType === "single" && singleDate) {
            filteredSales = filteredSales.filter((s) =>
                dayjs(s.created_at).isSame(singleDate, "day")
            );
        } else if (dateType === "range" && startDate && endDate) {
            filteredSales = filteredSales.filter((s) =>
                dayjs(s.created_at).isBetween(startDate, endDate, "day", "[]")
            );
        }

        // Préparer data exportée
        const data = filteredSales.map((s) => {
            const row = {};
            selectedColumns.forEach((col) => {
                switch (col.key) {
                    case "ref_client":
                        row[col.label] = s.ref_client;
                        break;
                    case "ref_contrat":
                        row[col.label] = s.ref_contrat;
                        break;
                    case "civilite":
                        row[col.label] = `${s.civilite || ""}`;
                        break;
                    case "client":
                        row[col.label] = `${s.client_name || ""} ${s.client_firstname || ""}`.trim();
                        break;
                    case "client_phone":
                        row[col.label] = s.client_phone;
                        break;
                    case "client_phone_fix":
                        row[col.label] = s.client_phone_fix;
                        break;
                    case "client_email":
                        row[col.label] = s.client_email;
                        break;
                    case "ville_client":
                        row[col.label] = s.ville_client;
                        break;
                    case "adresse_client":
                        row[col.label] = s.adresse_client;
                        break;
                    case "code_postal_client":
                        row[col.label] = s.code_postal_client;
                        break;
                    case "product_type":
                        row[col.label] = s.product_type;
                        break;
                    case "nature_offre":
                        row[col.label] = s.nature_offre;
                        break;
                    case "energie":
                        row[col.label] = s.energie;
                        break;
                    case "partenaire":
                        row[col.label] = s.partenaire;
                        break;
                    case "status":
                        row[col.label] = statusMap[s.status] || s.status;
                        break;
                    case "created_at":
                        row[col.label] = s.created_at
                            ? dayjs(s.created_at).format("DD/MM/YYYY HH:mm:ss")
                            : "";
                        break;
                    case "agent":
                        row[col.label] =
                            s.agent_firstname && s.agent_name
                                ? `${s.agent_firstname} ${s.agent_name}`
                                : "Inconnu";
                        break;
                    case "cancelled_reason":
                        row[col.label] = s.cancelled_reason || "";
                        break;
                    case "puissance_compteur":
                        row[col.label] = s.puissance_compteur || "";
                        break;
                    case "etat_contrat":
                        row[col.label] = s.etat_contrat || "";
                        break;
                    case "pdl":
                        row[col.label] = s.pdl || "";
                        break;
                    case "pce":
                        row[col.label] = s.pce || "";
                        break;
                    default:
                        row[col.label] = "";
                }
            });
            return row;
        });

        if (data.length === 0) {
            alert("Aucune vente ne correspond aux critères choisis.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ventes");
        XLSX.writeFile(wb, "ventes_export.xlsx");

        onClose();
    };

    const isExportDisabled = () =>
        selectedColumns.length === 0 || sales.length === 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex bg-blue-600 items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <Download className="h-6 w-6 text-white" />
                        <div>
                            <h2 className="text-xl font-semibold text-white">Exporter les ventes</h2>
                            <p className="text-sm text-blue-100">
                                Personnalisez votre export (agents, dates, colonnes)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="h-5 w-5 text-white" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Agents */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Users className="h-5 w-5 text-gray-600" /> Agents
                        </h3>
                        {selectedAgents.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedAgents.map((a) => (
                                    <div
                                        key={a.id}
                                        className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                    >
                                        <span>{`${a.name}` || ""}</span>
                                        <button
                                            onClick={() => handleAgentRemove(a.id)}
                                            className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="relative mt-3" ref={agentDropdownRef}>
                            <div
                                onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                                className="px-4 py-3 border rounded-lg cursor-pointer flex justify-between items-center"
                            >
                                <span className="text-gray-500">Choisir agents...</span>
                                <ChevronDown
                                    className={`h-4 w-4 text-gray-400 transition-transform ${agentDropdownOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </div>
                            {agentDropdownOpen && (
                                <div className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                                    <div className="p-2 border-b">
                                        <input
                                            type="text"
                                            placeholder="Rechercher agent..."
                                            value={agentSearchTerm}
                                            onChange={(e) => setAgentSearchTerm(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    {filteredAgents.map((a) => (
                                        <div
                                            key={a.id}
                                            onClick={() => handleAgentSelect(a)}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                        >
                                            {a.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Boutons tout sélectionner/désélectionner */}
                        <div className="flex gap-3 mt-2 ml-4">
                            <button
                                type="button"
                                onClick={() => setSelectedAgents([...uniqueAgents])}
                                className="text-green-600 text-sm hover:underline"
                            >
                                Tout sélectionner
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedAgents([])}
                                className="text-red-600 text-sm hover:underline"
                            >
                                Tout désélectionner
                            </button>
                        </div>
                    </div>

                    {/* Dates */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-600" /> Période
                        </h3>
                        <div className="mt-2 flex gap-6">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="dateType"
                                    value="single"
                                    checked={dateType === "single"}
                                    onChange={(e) => setDateType(e.target.value)}
                                />
                                Date unique
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="dateType"
                                    value="range"
                                    checked={dateType === "range"}
                                    onChange={(e) => setDateType(e.target.value)}
                                />
                                Intervalle
                            </label>
                        </div>
                        {dateType === "single" ? (
                            <input
                                type="date"
                                value={singleDate}
                                onChange={(e) => setSingleDate(e.target.value)}
                                className="mt-3 px-3 py-2 border rounded-lg"
                            />
                        ) : (
                            <div className="mt-3 flex gap-3">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 border rounded-lg"
                                />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 border rounded-lg"
                                />
                            </div>
                        )}
                    </div>

                    {/* Colonnes */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-600" /> Colonnes
                        </h3>
                        {selectedColumns.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedColumns.map((col) => (
                                    <div
                                        key={col.key}
                                        className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                                    >
                                        <span>{col.label}</span>
                                        <button
                                            onClick={() => handleColumnRemove(col.key)}
                                            className="ml-2 hover:bg-green-200 rounded-full p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="relative mt-3" ref={columnDropdownRef}>
                            <div
                                onClick={() => setColumnDropdownOpen(!columnDropdownOpen)}
                                className="px-4 py-3 border rounded-lg cursor-pointer flex justify-between items-center"
                            >
                                <span className="text-gray-500">Choisir colonnes...</span>
                                <ChevronDown
                                    className={`h-4 w-4 text-gray-400 transition-transform ${columnDropdownOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </div>
                            {columnDropdownOpen && (
                                <div className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                                    <div className="p-2 border-b">
                                        <input
                                            type="text"
                                            placeholder="Rechercher colonne..."
                                            value={columnSearchTerm}
                                            onChange={(e) => setColumnSearchTerm(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    {filteredColumns.map((col) => (
                                        <div
                                            key={col.key}
                                            onClick={() => handleColumnSelect(col)}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                        >
                                            {col.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-2 ml-4">
                            <button
                                type="button"
                                onClick={() => setSelectedColumns([...columnOptions])}
                                className="text-green-600 text-sm hover:underline"
                            >
                                Tout sélectionner
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedColumns([])}
                                className="text-red-600 text-sm hover:underline"
                            >
                                Tout désélectionner
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <div className="text-sm text-gray-500">
                        {selectedAgents.length} agent(s) • {selectedColumns.length} colonne(s)
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExportDisabled()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            <span>Exporter</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
