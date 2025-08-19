import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function SessionFilters({ onApply, onReset }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleApply = () => {
    onApply({
      search: search.trim(),
      status,
      startDate,
      endDate,
    });
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setStartDate(null);
    setEndDate(null);
    onReset();
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Recherche */}
      <div>
        
        <input
          type="text"
          placeholder="Rechercher (Nom, prénom, email)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
      </div>

      {/* Statut */}
      <div>
         <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border px-3 py-2 rounded-md w-40"
        >
          <option value="">Tous les status</option>
          <option value="Disponible">Disponible</option>
          <option value="Pause">Pause</option>
          <option value="Indisponible">Indisponible</option>
        </select>
      </div>

      {/* Date début */}
      <div>
        <DatePicker
          selected={startDate}
          onChange={setStartDate}
          className="border px-3 py-2 rounded-md w-36"
          placeholderText="Date de Début"
          dateFormat="yyyy-MM-dd"
          isClearable
        />
      </div>

      {/* Date fin */}
      <div>
        <DatePicker
          selected={endDate}
          onChange={setEndDate}
          className="border px-3 py-2 rounded-md w-36"
          placeholderText="Date de Fin"
          dateFormat="yyyy-MM-dd"
          isClearable
        />
      </div>

      {/* Boutons appliquer / réinitialiser alignés */}
      <div className="flex gap-2 items-center">
        <button
          onClick={handleApply}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 h-[38px]"
        >
          Appliquer
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 h-[38px]"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
