import React, { useState, useRef, useEffect } from "react";
import { X, Download, Calendar, Users, FileText, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

const ExportModalFiches = ({ isOpen, onClose, fiches = [] }) => {
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [dateType, setDateType] = useState("single");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportClosedOnly, setExportClosedOnly] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  const [columnSearchTerm, setColumnSearchTerm] = useState("");
  const agentDropdownRef = useRef(null);
  const columnDropdownRef = useRef(null);

  // ---- Colonnes disponibles ----
const columnOptions = [
  { key: "id", label: "ID" },
  { key: "univers", label: "Univers" },
  { key: "nom_client", label: "Nom Client" },
  { key: "prenom_client", label: "Prénom Client" },
  { key: "adresse_client", label: "Adresse Client" },
  { key: "code_postal", label: "Code Postal" },
  { key: "mail_client", label: "Mail Client" },
  { key: "numero_mobile", label: "Numéro Mobile" },
  { key: "statut", label: "Statut" },
  { key: "commentaire", label: "Commentaire" },
  { key: "agent_id", label: "Agent ID" },
  { key: "date_creation", label: "Date Création" },
  { key: "date_modification", label: "Date Modification" },
  { key: "date_import", label: "Date Import" },
  { key: "tag", label: "Tag" },
  { key: "assigned_to", label: "Assigné à (ID)" },
  { key: "assigned_to_name", label: "Assigné à (Nom)" },
  { key: "rendez_vous_date", label: "Date RDV" },
  { key: "rendez_vous_commentaire", label: "Commentaire RDV" },
  { key: "assigned_by", label: "Assigné par (ID)" },
  { key: "assigned_by_name", label: "Assigné par (Nom)" },
  { key: "date_assignation", label: "Date Assignation" },
];

  // ---- Agents disponibles (dédoublés depuis fiches) ----
  const uniqueAgents = Array.from(
    new Map(
      fiches
        .filter(f => f.agent_id || f.agent_firstname || f.agent_lastname)
        .map(f => [
          f.agent_id || `${f.agent_firstname}-${f.agent_lastname}`,
          {
            id: f.agent_id || `${f.agent_firstname}-${f.agent_lastname}`,
            firstname: f.agent_firstname,
            lastname: f.agent_lastname,
          },
        ])
    ).values()
  );

  const filteredAgents = uniqueAgents.filter(a =>
    `${a.firstname || ""} ${a.lastname || ""}`.toLowerCase().includes(agentSearchTerm.toLowerCase())
  );

  const filteredColumns = columnOptions.filter(c =>
    c.label.toLowerCase().includes(columnSearchTerm.toLowerCase())
  );

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

  const handleAgentSelect = (agent) => {
    if (!selectedAgents.find(a => a.id === agent.id)) setSelectedAgents([...selectedAgents, agent]);
    setAgentDropdownOpen(false);
  };

  const handleAgentRemove = (id) => {
    setSelectedAgents(selectedAgents.filter(a => a.id !== id));
  };

  const handleColumnSelect = (col) => {
    if (!selectedColumns.find(c => c.key === col.key)) setSelectedColumns([...selectedColumns, col]);
    setColumnDropdownOpen(false);
  };

  const handleColumnRemove = (key) => {
    setSelectedColumns(selectedColumns.filter(c => c.key !== key));
  };

  const handleExport = () => {
    let dataToExport = [...fiches];

    // Filtrer par agents
    if (selectedAgents.length) {
      const ids = selectedAgents.map(a => a.id);
      dataToExport = dataToExport.filter(
        f => ids.includes(f.agent_id) || ids.includes(`${f.agent_firstname}-${f.agent_lastname}`)
      );
    }

    // Filtrer par date
    if (dateType === "single" && singleDate) {
      dataToExport = dataToExport.filter(f =>
        dayjs(f.created_at).isSame(singleDate, "day")
      );
    } else if (dateType === "range" && startDate && endDate) {
      dataToExport = dataToExport.filter(f =>
        dayjs(f.created_at).isBetween(startDate, endDate, "day", "[]")
      );
    }

    // Filtres options
    if (exportClosedOnly) {
      dataToExport = dataToExport.filter(f => f.status === "clôturée");
    }

    if (!dataToExport.length) {
      alert("Aucune fiche ne correspond aux critères choisis.");
      return;
    }

    // Préparer l'export
    const rows = dataToExport.map(f => {
      const row = {};
      selectedColumns.forEach(col => {
        switch (col.key) {
          case "agent":
            row[col.label] = f.agent_firstname && f.agent_lastname ? `${f.agent_firstname} ${f.agent_lastname}` : "Inconnu";
            break;
          case "ref_fiche":
            row[col.label] = f.ref_fiche || "";
            break;
          case "client":
            row[col.label] = f.client_name || "";
            break;
          case "created_at":
            row[col.label] = f.created_at ? new Date(f.created_at).toLocaleDateString("fr-FR") : "";
            break;
          case "status":
            row[col.label] = f.status || "";
            break;
          case "type_fiche":
            row[col.label] = f.type_fiche || "";
            break;
          default:
            row[col.label] = "";
        }
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fiches");
    XLSX.writeFile(wb, "fiches_export.xlsx");
    onClose();
  };

  const isExportDisabled = () => selectedColumns.length === 0 || fiches.length === 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex bg-blue-600 items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-xl font-semibold text-white">Exporter les fiches</h2>
              <p className="text-sm text-blue-100">
                Personnalisez votre export (agents, dates, colonnes)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
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
                {selectedAgents.map(a => (
                  <div key={a.id} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <span>{`${a.firstname || ""} ${a.lastname || ""}`}</span>
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
                    <input type="text" placeholder="Rechercher agent..." value={agentSearchTerm} onChange={e => setAgentSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  {filteredAgents.map(a => (
                    <div key={a.id} onClick={() => handleAgentSelect(a)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      {a.firstname} {a.lastname}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-2 ml-4">
              <button type="button" onClick={() => setSelectedAgents([...uniqueAgents])} className="text-green-600 text-sm hover:underline">Tout sélectionner</button>
              <button type="button" onClick={() => setSelectedAgents([])} className="text-red-600 text-sm hover:underline">Tout désélectionner</button>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" /> Période
            </h3>
            <div className="mt-2 flex gap-6">
              <label className="flex items-center gap-2">
                <input type="radio" name="dateType" value="single" checked={dateType === "single"} onChange={e => setDateType(e.target.value)} /> Date unique
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="dateType" value="range" checked={dateType === "range"} onChange={e => setDateType(e.target.value)} /> Intervalle
              </label>
            </div>
            {dateType === "single" ? (
              <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} className="mt-3 px-3 py-2 border rounded-lg" />
            ) : (
              <div className="mt-3 flex gap-3">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
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
                {selectedColumns.map(col => (
                  <div key={col.key} className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <span>{col.label}</span>
                    <button onClick={() => handleColumnRemove(col.key)} className="ml-2 hover:bg-green-200 rounded-full p-0.5">
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
                    <input type="text" placeholder="Rechercher colonne..." value={columnSearchTerm} onChange={e => setColumnSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  {filteredColumns.map(col => (
                    <div key={col.key} onClick={() => handleColumnSelect(col)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      {col.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-2 ml-4">
              <button type="button" onClick={() => setSelectedColumns([...columnOptions])} className="text-green-600 text-sm hover:underline">Tout sélectionner</button>
              <button type="button" onClick={() => setSelectedColumns([])} className="text-red-600 text-sm hover:underline">Tout désélectionner</button>
            </div>
          </div>

          {/* Options fiches */}
          <div>
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={exportClosedOnly} onChange={() => setExportClosedOnly(!exportClosedOnly)} />
              Exporter uniquement les fiches clôturées
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={includeHistory} onChange={() => setIncludeHistory(!includeHistory)} />
              Inclure l'historique des fiches
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="text-sm text-gray-500">{selectedAgents.length} agent(s) • {selectedColumns.length} colonne(s)</div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Annuler</button>
            <button onClick={handleExport} disabled={isExportDisabled()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <Download className="h-4 w-4" /> <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModalFiches;
