import React, { useEffect, useMemo, useState } from 'react';
import { X, UserPlus, Search } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import Swal from "sweetalert2";

interface Agent {
  id: number;
  name: string;
}

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (agentId: number) => void;
  ficheId: number | null;
  agents: Agent[];
  currentAgentId?: number | null;
  selectedFiches?: number[];
}
const AssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  ficheId,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedAgentId(null);
      setConfirmStep(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Récupération des agents dans la base
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await axiosInstance.get('/users_bd');
        setAgents(res.data);
      } catch (error) {
        console.error("❌ Erreur chargement agents:", (error as any).response?.data || (error as any).message);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(a =>
      a.name.toLowerCase().includes(q)
    );
  }, [agents, search]);

  const selectedAgent = useMemo(
    () => agents.find(a => a.id === selectedAgentId) || null,
    [agents, selectedAgentId]
  );

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0].toUpperCase()}${parts[1][0].toUpperCase()}`;
  };

   const handleAssignClick = async () => {
    if (!selectedAgent) return;

    const result = await Swal.fire({
      icon: 'question',
      title: 'Confirmer l’assignation',
      text: `Voulez-vous vraiment assigner la fiche à ${selectedAgent.name} ?`,
      showCancelButton: true,
      confirmButtonText: 'Oui, assigner',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#dc2626',
    });

    if (result.isConfirmed) {
      setSubmitting(true);
      try {
        await onAssign(selectedAgent.id);
        Swal.fire({
          icon: 'success',
          title: 'Assignation réussie',
          text: `La fiche a été assignée à ${selectedAgent.name}.`,
          confirmButtonColor: "#2563eb",
        });
        onClose();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur d’assignation',
          text: err?.response?.data?.error || 'Une erreur est survenue lors de l’assignation.',
          confirmButtonColor: "#dc2626",
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  const headerSubtitle = ficheId ? `Fiche N°: ${ficheId}` : `Fiches sélectionnées`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assigner des fiches</h2>
            <p className="text-sm text-gray-600 mt-1">{headerSubtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Recherche */}
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un agent (nom, prenom…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Liste des agents */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {filteredAgents.length === 0 && (
              <div className="text-sm text-gray-500 p-3 border border-dashed rounded-lg">
                Aucun agent trouvé.
              </div>
            )}
            {filteredAgents.map((agent) => {
              const active = selectedAgentId === agent.id;
              return (
                <label
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50 ${active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200'}`}
                >
                  <input
                    type="radio"
                    name="agent"
                    value={agent.id}
                    checked={active}
                    onChange={() => setSelectedAgentId(agent.id)}
                    className="sr-only"
                  />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${active ? 'bg-blue-600' : 'bg-gray-400'}`}>
                    {getInitials(agent.name)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{agent.name}</div>
                  </div>
                  {active && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </label>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!selectedAgentId || submitting}
              onClick={handleAssignClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={16} />
              {submitting ? 'Assignation…' : 'Assigner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignModal;