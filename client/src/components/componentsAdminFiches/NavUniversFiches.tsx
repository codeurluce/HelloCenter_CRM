// src/components/componentsAdminFiches/FichesTabs.tsx
import React from 'react';

interface NavUniversFichesProps {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

const FichesTabs: React.FC<NavUniversFichesProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <nav className="flex space-x-2 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-6 py-3 rounded-t-xl font-medium text-sm transition-all ${
            activeTab === tab.key
              ? 'bg-white text-blue-600 shadow-md border border-b-0 border-gray-200'
              : 'bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 border border-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default FichesTabs;