import React from 'react';
import { User, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Fiche } from './fiche';

interface AdminAgentStatsProps {
  fiches: Fiche[];
  agents: Array<{ id: number; name: string; email: string }>;
}

const AdminAgentStats: React.FC<AdminAgentStatsProps> = ({ fiches, agents }) => {
  
  const getAgentStats = (agentId: number) => {
    const agentFiches = fiches.filter(f => f.assigned_to === agentId);
    return {
      total: agentFiches.length,
      en_cours: agentFiches.filter(f => f.statut === 'en_traitement').length,
      rendez_vous: agentFiches.filter(f => f.statut === 'rendez_vous').length,
      cloturees: agentFiches.filter(f => f.statut === 'cloturee').length,
    };
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp size={20} />
          Performance des Agents
        </h3>
        <p className="text-sm text-gray-600 mt-1">Suivi des fiches par agent</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const stats = getAgentStats(agent.id);
            return (
              <div key={agent.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {getInitials(agent.name)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{agent.name}</div>
                    <div className="text-sm text-gray-500">{agent.email}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded-lg">
                    <div className="text-xl font-bold text-yellow-700">{stats.en_cours}</div>
                    <div className="text-xs text-yellow-600">En cours</div>
                  </div>
                  <div className="text-center p-2 bg-amber-50 rounded-lg">
                    <div className="text-xl font-bold text-amber-700">{stats.rendez_vous}</div>
                    <div className="text-xs text-amber-600">RDV</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-700">{stats.cloturees}</div>
                    <div className="text-xs text-green-600">Clôturées</div>
                  </div>
                </div>
                
                {/* Taux de conversion */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Taux de clôture</div>
                    <div className="text-lg font-bold text-blue-600">
                      {stats.total > 0 ? Math.round((stats.cloturees / stats.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminAgentStats;