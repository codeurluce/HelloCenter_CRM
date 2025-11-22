// src/components/componentsAdminFiches/FichesFiltersBar.tsx
import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { AdminFilterType } from '../componentsdesongletsAdmins/AdminFichiersPanel';

interface FichesFiltersBarProps {
  activeFilter: AdminFilterType;
  counters: Record<AdminFilterType, number>;
  searchAgentTerm: string;
  onFilterChange: (filter: AdminFilterType) => void;
  onAgentSearchChange: (term: string) => void;
  onRefresh: () => void;
}

const FichesFiltersBar: React.FC<FichesFiltersBarProps> = ({
  activeFilter,
  counters,
  searchAgentTerm,
  onFilterChange,
  onAgentSearchChange,
  onRefresh,
}) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {(['nouvelles', 'assignees', 'en_cours', 'rendez_vous', 'cloturees', 'toutes'] as AdminFilterType[]).map(
        (f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeFilter === f
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f}{' '}
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
              {counters[f]}
            </span>
          </button>
        )
      )}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Filtre par agent..."
          value={searchAgentTerm}
          onChange={(e) => onAgentSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
        />
      </div>
      <button
        onClick={onRefresh}
        className="flex ml-6 items-center gap-2 py-1 px-3 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition ml-auto"
      >
        <RefreshCw size={16} /> Rafraîchir
      </button>
    </div>
  );
};

export default FichesFiltersBar;