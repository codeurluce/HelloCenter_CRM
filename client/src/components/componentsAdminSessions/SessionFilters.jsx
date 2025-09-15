import React from "react";
import { statuses } from '../../shared/StatusSelector';



// Statuts spécifiques à ajouter manuellement
const additionalOptions = [
  { value: "", label: "Tous les statuts" },
  { value: "En ligne", label: "En ligne" },
  { value: "Hors ligne", label: "Hors connexion" },
];

// Extraire les statuts depuis statuses, en utilisant statusFr (texte français)
const dynamicOptions = statuses.map((s) => ({
  value: s.statusFr,
  label: s.statusFr,
}));

// Fusionner et éviter doublons avec Set
const uniqueOptionsMap = new Map();
[...additionalOptions, ...dynamicOptions].forEach(opt => {
  uniqueOptionsMap.set(opt.value, opt);
});

const sessionStatusFilterOptions = Array.from(uniqueOptionsMap.values());

export default function SessionFilters({
  q,
  setQ,
  sessionStatusFilter,
  setSessionStatusFilter,
  onResetPage,
}) {
  
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="text"
        placeholder="Rechercher par agent"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          onResetPage?.();
        }}
        className="pl-3 pr-3 py-2 rounded-lg border border-gray-200 w-64"
      />

      <select
        value={sessionStatusFilter}
        onChange={(e) => {
          setSessionStatusFilter(e.target.value);
          onResetPage?.();
        }}
        className="px-3 py-2 rounded-lg border border-gray-200"
      >
        {sessionStatusFilterOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
