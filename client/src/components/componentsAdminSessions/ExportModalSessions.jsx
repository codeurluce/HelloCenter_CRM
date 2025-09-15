import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Calendar, Users, FileText, Clock, ChevronDown, Search, ClockArrowUp, ClockArrowDown, Coffee, Utensils, Armchair, ClockAlert, BookOpen } from 'lucide-react';
import { exportData } from '../utils/exportUtils';
import axios from 'axios';
import dayjs from "dayjs";
import { statuses } from '../../shared/StatusSelector';

const ExportModal = ({ isOpen, onClose, agents = [] }) => {
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [dateType, setDateType] = useState('single');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const [statusSearchTerm, setStatusSearchTerm] = useState('');

  const agentDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

const additionalStatusOptions = [
  { key: 'heureConnexion', label: 'Heure de connexion', icon: ClockArrowUp },
  { key: 'heureDeconnexion', label: 'Heure de déconnexion', icon: ClockArrowDown },
  { key: 'TotalPause', label: 'Total des pauses', icon: ClockAlert },
  { key: 'TotalIndispo', label: 'Total des indisponibilités', icon: X },
];

// Fusionner les deux listes
const statusOptions = [
  ...additionalStatusOptions, 
  ...statuses.map(({ key, statusFr, icon }) => ({
    key,
    label: statusFr,
    icon
  }))
];
  // Filtre agents en fonction recherche
  const filteredAgents = agents.filter(agent => {
    const fullName = `${agent.firstname || ''} ${agent.lastname || ''}`.trim();
    return fullName.toLowerCase().includes(agentSearchTerm.toLowerCase());
  });

  // Filtre statuts en fonction recherche
  const filteredStatuses = statusOptions.filter(status =>
    status.label.toLowerCase().includes(statusSearchTerm.toLowerCase())
  );

  // Gestion clic extérieur dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setAgentDropdownOpen(false);
        setAgentSearchTerm('');
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
        setStatusSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAgentSelect = (agent) => {
    if (!selectedAgents.find(a => a.user_id === agent.user_id)) {
      setSelectedAgents([...selectedAgents, agent]);
    }
    setAgentDropdownOpen(false);
    setAgentSearchTerm('');
  };

  const handleAgentRemove = (agentId) => {
    setSelectedAgents(selectedAgents.filter(a => a.user_id !== agentId));
  };

  const handleStatusSelect = (status) => {
    if (!selectedStatuses.find(s => s.key === status.key)) {
      setSelectedStatuses([...selectedStatuses, status]);
    }
    setStatusDropdownOpen(false);
    setStatusSearchTerm('');
  };

  const handleStatusRemove = (statusKey) => {
    setSelectedStatuses(selectedStatuses.filter(s => s.key !== statusKey));
  };

  // Formatage seconde => HH:mm:ss
 function formatSeconds(sec) {
    if (!sec || sec <= 0) return "00:00:00";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // Fonction d'export qui appelle backend puis exporte
  const handleExport = async () => {
    if (!selectedAgents.length || !selectedStatuses.length) return;
    if (dateType === 'single' && !singleDate) return;
    if (dateType === 'range' && (!startDate || !endDate)) return;

    // Préparer paramètres
    const userIds = selectedAgents.map(agent => agent.user_id);
    const body = {
      userIds,
      startDate: dateType === 'single' ? singleDate : startDate,
      endDate: dateType === 'single' ? singleDate : endDate,
    };

    try {
      const response = await axios.post('http://localhost:5000/api/session_agents/export-sessions', body);
      const rows = response.data;

      // Construire tableau pour export en fonction des statuts choisis
      const dataToExport = rows.map(row => {
        const exportRow = {};

        const date = row.first_connection ? dayjs(row.first_connection).format("YYYY-MM-DD") : "-";
        const heureConnexion = row.first_connection ? dayjs(row.first_connection).format("HH:mm:ss") : "-";
        const heureDeconnexion = row.last_disconnection ? dayjs(row.last_disconnection).format("HH:mm:ss") : "-";

        exportRow["Date"] = date;
        selectedStatuses.forEach(status => {
          switch (status.key) {
            case 'presenceTotale':
              exportRow['Présence totale'] = formatSeconds(row.presence_totale_sec);
              break;
            case 'tempsDisponible':
              exportRow['Temps disponible'] = formatSeconds(row.cumul_statuts?.Disponible || 0);
              break;
             case 'pause_cafe_1':
              exportRow['Pausette 1'] = formatSeconds(row.cumul_statuts?.['Pausette 1'] || 0);
              break;
            case 'pause_dejeuner':
              exportRow['Pause Déjeuner'] = formatSeconds(row.cumul_statuts?.['Pause Déjeuner'] || 0);
              break;
            case 'pause_cafe_2':
              exportRow['Pausette 2'] = formatSeconds(row.cumul_statuts?.['Pausette 2'] || 0);
              break;
            case 'TotalPause':
              exportRow['Total des pauses'] = formatSeconds(
                (row.cumul_statuts?.['Pausette 1'] || 0) +
                (row.cumul_statuts?.['Pause Déjeuner'] || 0) +
                (row.cumul_statuts?.['Pausette 2'] || 0)
              );
              break;
            case 'reunion':
              exportRow['Réunion'] = formatSeconds(row.cumul_statuts?.['Réunion'] || 0);
              break;
            case 'brief':
              exportRow['Brief'] = formatSeconds(row.cumul_statuts?.['Brief'] || 0);
              break;
            case 'pause_formation':
              exportRow['Formation'] = formatSeconds(row.cumul_statuts?.['Formation'] || 0);
              break;
            case 'TotalIndispo':
              exportRow['Total des indisponibilités'] = formatSeconds(
                (row.cumul_statuts?.['Réunion'] || 0) +
                (row.cumul_statuts?.['Brief'] || 0) +
                (row.cumul_statuts?.['Formation'] || 0)
              );
              break;
            case 'heureConnexion':
              exportRow['Heure de connexion'] = heureConnexion;
              break;
            case 'heureDeconnexion':
              exportRow['Heure de déconnexion'] = heureDeconnexion;
              break;
            default:
              break;
          }
        });


        exportRow["Prénom"] = row.firstname || "";
        exportRow["Nom"] = row.lastname || "";
        exportRow['Agent'] = `${row.firstname || ''} ${row.lastname || ''}`.trim();
        return exportRow;
      });

      exportData(dataToExport, 'export_agents');
      onClose();
    } catch (error) {
      console.error('Erreur lors de l’export:', error);
      alert('Erreur lors de l’export des données.');
    }
  };
 
  const isExportDisabled = () => {
    const hasAgents = selectedAgents.length > 0;
    const hasDate = dateType === 'single' ? singleDate : (startDate && endDate);
    const hasStatuses = selectedStatuses.length > 0;
    return !hasAgents || !hasDate || !hasStatuses;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex bg-blue-600 items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Exporter les données</h2>
              <p className="text-sm text-white-500">Personnalisez votre export selon vos besoins</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Agents */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Agents à exporter</h3>
            </div>

            {selectedAgents.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedAgents.map(agent => (
                  <div key={agent.user_id} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <span>{`${agent.firstname} ${agent.lastname}`}</span>
                    <button
                      onClick={() => handleAgentRemove(agent.user_id)}
                      className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                      aria-label={`Supprimer ${agent.firstname} ${agent.lastname}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative" ref={agentDropdownRef}>
              <div
                onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">{selectedAgents.length === 0 ? 'Rechercher et sélectionner des agents...' : 'Ajouter d\'autres agents...'}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${agentDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {agentDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-hidden">
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un agent..."
                        value={agentSearchTerm}
                        onChange={(e) => setAgentSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredAgents.length > 0 ? (
                      filteredAgents.map(agent => {
                        const fullName = `${agent.firstname} ${agent.lastname}`;
                        const isSelected = selectedAgents.find(a => a.user_id === agent.user_id);
                        return (
                          <div
                            key={agent.user_id}
                            onClick={() => handleAgentSelect(agent)}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${isSelected ? 'bg-blue-50 text-blue-700' : ''}`}
                          >
                            <span>{fullName}</span>
                            {isSelected && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">Aucun agent trouvé</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mb-3">
              <button
                type="button"
                onClick={() => setSelectedAgents([...agents])}
                className="text-blue-600 text-sm hover:underline"
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

          {/* Période */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Période</h3>
            </div>
            <div className="space-y-3">
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateType"
                    value="single"
                    checked={dateType === 'single'}
                    onChange={(e) => setDateType(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Date unique</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateType"
                    value="range"
                    checked={dateType === 'range'}
                    onChange={(e) => setDateType(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Intervalle de dates</span>
                </label>
              </div>

              {dateType === 'single' ? (
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statuts */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Données à exporter</h3>
            </div>

            {selectedStatuses.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedStatuses.map(status => {
                  const IconComponent = status.icon;
                  return (
                    <div key={status.key} className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      <IconComponent className="h-3 w-3 mr-1" />
                      <span>{status.label}</span>
                      <button
                        onClick={() => handleStatusRemove(status.key)}
                        className="ml-2 hover:bg-green-200 rounded-full p-0.5"
                        aria-label={`Supprimer ${status.label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="relative" ref={statusDropdownRef}>
              <div
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">{selectedStatuses.length === 0 ? 'Rechercher et sélectionner des données...' : 'Ajouter d\'autres données...'}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {statusDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-hidden">
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher une donnée..."
                        value={statusSearchTerm}
                        onChange={(e) => setStatusSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredStatuses.length > 0 ? (
                      filteredStatuses.map(status => {
                        const IconComponent = status.icon;
                        const isSelected = selectedStatuses.find(s => s.key === status.key);
                        return (
                          <div
                            key={status.key}
                            onClick={() => handleStatusSelect(status)}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${isSelected ? 'bg-green-50 text-green-700' : ''}`}
                          >
                            <div className="flex items-center space-x-3">
                              <IconComponent className="h-4 w-4 text-gray-500" />
                              <span>{status.label}</span>
                            </div>
                            {isSelected && <div className="w-2 h-2 bg-green-600 rounded-full"></div>}
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">Aucune donnée trouvée</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mb-3">
              <button
                type="button"
                onClick={() => setSelectedStatuses([...statusOptions])}
                className="text-green-600 text-sm hover:underline"
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatuses([])}
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
            {selectedAgents.length} agent(s) • {selectedStatuses.length} donnée(s) sélectionnée(s)
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={isExportDisabled()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
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