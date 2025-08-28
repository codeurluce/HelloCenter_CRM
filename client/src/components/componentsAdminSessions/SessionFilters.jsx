import React from "react";

export default function SessionFilters({
  q,
  setQ,
  sessionStatusFilter,
  setSessionStatusFilter,
  onResetPage,
}) {
  const sessionStatusFilterOptions = [
    { value: "", label: "Tous les statuts" },
    { value: "En ligne", label: "En ligne" },
    { value: "Disponible", label: "Disponible" },
    { value: "Pause Café", label: "Pause Café" },
    { value: "Pause Déjeuner", label: "Pause Déjeuner" },
    { value: "Autre Pause", label: "Autre Pause" },
    { value: "Formation", label: "Formation" },
    { value: "Indisponible", label: "Indisponible" },
    { value: "Hors ligne", label: "Hors connexion" },
  ];

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
