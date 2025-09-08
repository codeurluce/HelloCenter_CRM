import React, { useState, useRef, useEffect } from "react";
import { X, Download, Calendar, Users, FileText, ChevronDown } from "lucide-react";
import columnOptions from "../../shared/columnsConfig";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { Fiche } from "./fiche";
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

interface Agent {
  id: number;
  name: string;
}

interface ColumnOption {
  key: string;
  label: string;
}

interface ExportModalFichesProps {
  isOpen: boolean;
  onClose: () => void;
  fiches: Fiche[];
}

const ExportModalFiches: React.FC<ExportModalFichesProps> = ({ isOpen, onClose, fiches }) => {
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ColumnOption[]>([]);
  const [dateType, setDateType] = useState<"single" | "range">("single");
  const [singleDate, setSingleDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [exportClosedOnly, setExportClosedOnly] = useState<boolean>(true);
  const [includeHistory, setIncludeHistory] = useState<boolean>(false);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState<boolean>(false);
  const [columnDropdownOpen, setColumnDropdownOpen] = useState<boolean>(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState<string>("");
  const [columnSearchTerm, setColumnSearchTerm] = useState<string>("");
  const agentDropdownRef = useRef<HTMLDivElement | null>(null);
  const columnDropdownRef = useRef<HTMLDivElement | null>(null);

  // Colonnes disponibles
// const columnOptions: ColumnOption[] = [
//   { key: "id", label: "N° Fiche" },
//   { key: "univers", label: "Univers" },
//   { key: "nom_client", label: "Nom du client" },
//   { key: "prenom_client", label: "Prénom du client" },
//   { key: "adresse_client", label: "Adresse" },
//   { key: "code_postal", label: "Code postal" },
//   { key: "mail_client", label: "Email" },
//   { key: "numero_mobile", label: "Téléphone" },
//   { key: "statut", label: "Statut" },
//   { key: "commentaire", label: "Notes" },
//   { key: "assigned_to", label: "Agent assigné (ID)" },
//   { key: "assigned_to_name", label: "Agent assigné" },
//   { key: "assigned_by", label: "Assigné par (ID)" },
//   { key: "assigned_by_name", label: "Assigné par" },
//   { key: "date_assignation", label: "Date d’assignation" },
//   { key: "date_creation", label: "Date de création" },
//   { key: "date_modification", label: "Dernière modification" },
//   { key: "date_import", label: "Date d’import" },
//   { key: "tag", label: "Tag(s)" },
//   { key: "rendez_vous_date", label: "Date du RDV" },
//   { key: "rendez_vous_commentaire", label: "Commentaire du RDV" },
// ];


  // Agents uniques dédupliqués
  const uniqueAgents: Agent[] = Array.from(
    new Map(
      fiches
        .filter(f => f.assigned_to !== undefined)
        .map(f => [
          f.assigned_to!,
          {
            id: f.assigned_to!,
            name: f.assigned_to_name || "Inconnu",
          },
        ])
    ).values()
  );

  const filteredAgents = uniqueAgents.filter(a =>
    a.name.toLowerCase().includes(agentSearchTerm.toLowerCase())
  );

  const filteredColumns = columnOptions.filter(c =>
    c.label.toLowerCase().includes(columnSearchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(e.target as Node)) {
        setAgentDropdownOpen(false);
        setAgentSearchTerm("");
      }
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target as Node)) {
        setColumnDropdownOpen(false);
        setColumnSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAgentSelect = (agent: Agent) => {
    if (!selectedAgents.find(a => a.id === agent.id)) {
      setSelectedAgents([...selectedAgents, agent]);
    }
    setAgentDropdownOpen(false);
  };

  const handleAgentRemove = (id: number) => {
    setSelectedAgents(selectedAgents.filter(a => a.id !== id));
  };

  const handleColumnSelect = (col: ColumnOption) => {
    if (!selectedColumns.find(c => c.key === col.key)) {
      setSelectedColumns([...selectedColumns, col]);
    }
    setColumnDropdownOpen(false);
  };

  const handleColumnRemove = (key: string) => {
    setSelectedColumns(selectedColumns.filter(c => c.key !== key));
  };

const handleExport = async () => {
  if (selectedColumns.length === 0) {
    alert("Veuillez sélectionner au moins une colonne à exporter.");
    return;
  }

  try {
    const params = new URLSearchParams();
    if(selectedAgents.length > 0) params.append("agents", JSON.stringify(selectedAgents.map(a => a.id)));
    params.append("columns", JSON.stringify(selectedColumns.map(c => c.key)));
    params.append("dateType", dateType);
    if(dateType === 'single') {
      if(!singleDate) {
        alert("Veuillez sélectionner une date.");
        return;
      }
      params.append("singleDate", singleDate);
    } else {
      if(!startDate || !endDate) {
        alert("Veuillez sélectionner une plage de dates.");
        return;
      }
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    }
    params.append("exportClosedOnly", exportClosedOnly.toString());

    const response = await fetch(`http://localhost:5000/api/files/export_files?${params.toString()}`);


    if(!response.ok) {
      alert("Erreur récupération fichier.");
      return;
    }

    const blob = await response.blob();

    // Forcer le téléchargement du fichier
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "export_fiches.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch(error) {
    console.error("Erreur export:", error);
    alert("Erreur lors de l’export.");
  }
};


const isExportDisabled = () =>
    selectedColumns.length === 0 || fiches.length === 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex bg-blue-600 items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                Exporter les fiches
              </h2>
              <p className="text-sm text-blue-100">
                Personnalisez votre export (agents, dates, colonnes)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
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
                {selectedAgents.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{a.name}</span>
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
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    agentDropdownOpen ? "rotate-180" : ""
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
                      onChange={e => setAgentSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  {filteredAgents.map(a => (
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
                  onChange={e =>
                    setDateType(e.target.value as "single" | "range")
                  }
                />{" "}
                Date unique
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dateType"
                  value="range"
                  checked={dateType === "range"}
                  onChange={e =>
                    setDateType(e.target.value as "single" | "range")
                  }
                />{" "}
                Intervalle
              </label>
            </div>
            {dateType === "single" ? (
              <input
                type="date"
                value={singleDate}
                onChange={e => setSingleDate(e.target.value)}
                className="mt-3 px-3 py-2 border rounded-lg"
              />
            ) : (
              <div className="mt-3 flex gap-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
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
                {selectedColumns.map(col => (
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
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    columnDropdownOpen ? "rotate-180" : ""
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
                      onChange={e => setColumnSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  {filteredColumns.map(col => (
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
              <Download className="h-4 w-4" /> <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModalFiches;
