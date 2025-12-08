import React, { useState, useRef, useEffect } from "react";
import { Trash2, Users, X, ChevronDown } from "lucide-react";
import Swal from "sweetalert2";
import axiosInstance from "../../api/axiosInstance";

export default function CleanShiftModal({ isOpen, onClose, agents = [], onSaved }) {
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [cleanStart, setCleanStart] = useState("");
  const [cleanEnd, setCleanEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState("");

  const agentDropdownRef = useRef(null);

  // Fermeture dropdown si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(e.target)) {
        setAgentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

      if (!isOpen) return null;

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(agentSearchTerm.toLowerCase())
  );

  const selectAllAgents = () => setSelectedAgents([...agents]);
  const deselectAllAgents = () => setSelectedAgents([]);
  const handleAgentSelect = (agent) => {
    if (!selectedAgents.find(a => a.id === agent.id)) {
      setSelectedAgents([...selectedAgents, agent]);
      setAgentSearchTerm("");
    }
  };
  const handleAgentRemove = (id) => {
    setSelectedAgents(selectedAgents.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    if (!cleanStart) return Swal.fire("Erreur", "La date de début est obligatoire", "error");
    if (selectedAgents.length === 0) return Swal.fire("Erreur", "Sélectionnez au moins un agent", "error");

    const agentNames = selectedAgents.map(a => a.name).join(", ");

    const result = await Swal.fire({
      icon: 'question',
      title: 'Confirmer Réajustement',
      html: `Voulez-vous vraiment réajuster les sessions de <b>${agentNames}</b> pour la date <b>${cleanStart}</b> ?`,
      showCancelButton: true,
      confirmButtonText: 'Oui, Réajuster',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#6d28d9',
      cancelButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      await axiosInstance.post("/session_agents/clean-shift", {
        startDate: cleanStart,
        endDate: cleanEnd || cleanStart,
        userIds: selectedAgents.map(a => a.id),
      });

      Swal.fire("Succès", "Réajustement effectué !", "success");
      onSaved();
      onClose();
      setSelectedAgents([]);
      setCleanStart("");
      setCleanEnd("");
    } catch (err) {
      console.error(err);
      Swal.fire("Erreur", err?.response?.data?.message || "Erreur lors du Réajuster", "error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-700">
            <Trash2 size={24} /> Réajuster des shifts
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>

        {/* Formulaire */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date début</label>
            <input
              type="date"
              value={cleanStart}
              onChange={(e) => setCleanStart(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-purple-400 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date fin</label>
            <input
              type="date"
              value={cleanEnd}
              onChange={(e) => setCleanEnd(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-purple-400 focus:outline-none transition"
            />
          </div>

          {/* Dropdown multi-agents */}
          <div className="sm:col-span-2" ref={agentDropdownRef}>
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

            <div className="relative mt-3">
              <div onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                   className="px-4 py-3 border rounded-lg cursor-pointer flex justify-between items-center">
                <span className="text-gray-500">Choisir agents...</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${agentDropdownOpen ? "rotate-180" : ""}`} />
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
                    <div key={a.id} onClick={() => handleAgentSelect(a)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      {a.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading && (
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
            )}
            Régulariser
          </button>
        </div>
      </div>
    </div>
  );
}
