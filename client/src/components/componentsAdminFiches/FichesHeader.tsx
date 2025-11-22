// src/components/componentsAdminFiches/FichesHeader.tsx
import React from 'react';
import { Search, Download, Upload } from 'lucide-react';

interface FichesHeaderProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onOpenImport: () => void;
    onOpenExport: () => void;
}

const FichesHeader: React.FC<FichesHeaderProps> = ({
    searchTerm,
    onSearchChange,
    onOpenImport,
    onOpenExport,
}) => {
    return (
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold mb-4">Administration des Fiches</h2>
                <p className="text-gray-600">Gestion complète et assignation aux agents</p>
            </div>
            <div className="flex gap-3">
                <div className="relative">
                    <Search
                        size={20}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="nom client, téléphone, email..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                    />
                </div>
                <button
                    onClick={onOpenImport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                    <Download size={18} /> Importer
                </button>
                <button
                    onClick={onOpenExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                >
                    <Upload size={18} /> Exporter
                </button>
            </div>
        </div>
    )
};

export default FichesHeader;