import React, { useState } from 'react';
import { X, UserPlus, User } from 'lucide-react';

interface Agent {
  id: number;
  name: string;
  email: string;
}

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (agentId: number) => void;
  agents: Agent[];
  currentAgentId: number | null;
  ficheId: number | null;
}

const AssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  agents,
  currentAgentId,
  ficheId,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(currentAgentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAgentId) {
      onAssign(selectedAgentId);
    }
  };

  const handleClose = () => {
    setSelectedAgentId(currentAgentId);
    onClose();
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {currentAgentId ? 'Réassigner la fiche' : 'Assigner la fiche'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Fiche #{ficheId}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          
          {/* Agent actuellement assigné */}
          {currentAgentId && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {getInitials(agents.find(a => a.id === currentAgentId)?.name || '')}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Actuellement assignée à:</div>
                  <div className="text-sm text-blue-700 font-semibold">
                    {agents.find(a => a.id === currentAgentId)?.name}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sélection nouvel agent */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              {currentAgentId ? 'Nouvel agent' : 'Sélectionner un agent'}
            </label>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {agents.map((agent) => (
                <label
                  key={agent.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                    selectedAgentId === agent.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="agent"
                    value={agent.id}
                    checked={selectedAgentId === agent.id}
                    onChange={() => setSelectedAgentId(agent.id)}
                    className="sr-only"
                  />
                  
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                    selectedAgentId === agent.id ? 'bg-blue-600' : 'bg-gray-400'
                  }`}>
                    {getInitials(agent.name)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{agent.name}</div>
                    <div className="text-sm text-gray-500">{agent.email}</div>
                  </div>

                  {selectedAgentId === agent.id && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedAgentId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={16} />
              {currentAgentId ? 'Réassigner' : 'Assigner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignModal;