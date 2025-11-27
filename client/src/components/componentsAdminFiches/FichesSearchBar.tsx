import React from "react";
import { Search } from "lucide-react";

interface FichesSearchBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

const FichesSearchBar: React.FC<FichesSearchBarProps> = ({
    searchTerm,
    onSearchChange,
}) => {
    return (
        <div className="relative">
            <Search size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder="nom client, téléphone, email..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
            />
        </div>
    );
};

export default FichesSearchBar;