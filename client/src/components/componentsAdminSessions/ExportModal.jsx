// src/components/componentsAdminSessions/ExportModal.jsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const STATUSES = ["Disponible", "Indisponible", "Pause"];

const ExportModal = ({ agents, onExport, onClose }) => {
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const toggleAgent = (id) => {
    setSelectedAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleExport = () => {
    onExport({ selectedAgents, statuses: selectedStatuses, startDate, endDate });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-w-full">
        <h2 className="text-xl font-semibold mb-4">Exporter les sessions</h2>

        <div className="mb-4">
          <label className="font-medium">Agents :</label>
          <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-auto border p-2 rounded">
            {agents.map(agent => (
              <button
                key={agent.id}
                className={`px-2 py-1 border rounded ${
                  selectedAgents.includes(agent.id) ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => toggleAgent(agent.id)}
              >
                {agent.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="font-medium">Statuts :</label>
          <div className="flex gap-2 mt-2">
            {STATUSES.map(status => (
              <button
                key={status}
                className={`px-2 py-1 border rounded ${
                  selectedStatuses.includes(status) ? "bg-green-500 text-white" : ""
                }`}
                onClick={() => toggleStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <div>
            <label className="font-medium block mb-1">Date de début :</label>
            <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              className="border p-2 rounded w-full"
              placeholderText="Sélectionner une date"
            />
          </div>
          <div>
            <label className="font-medium block mb-1">Date de fin :</label>
            <DatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              className="border p-2 rounded w-full"
              placeholderText="Sélectionner une date"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 border rounded hover:bg-gray-100"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleExport}
          >
            Exporter
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
