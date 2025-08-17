// src/components/admin/SearchFilterBar.jsx
import React from "react";
import { Search, RefreshCw, Plus } from "lucide-react";

export default function SearchFilterBar({
  q,
  setQ,
  roleFilter,
  setRoleFilter,
  rolesOptions,
  onRefresh,
  onCreate,         
  onResetPage,       
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onResetPage?.();
          }}
          placeholder="Rechercher (nom, email, univers)"
          className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
      </div>

      {/* Filtre rôle */}
      <select
        value={roleFilter}
        onChange={(e) => {
          setRoleFilter(e.target.value);
          onResetPage?.();
        }}
        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none"
      >
        <option value="">Tous les rôles</option>
        {rolesOptions.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {/* <select
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        className="border rounded p-2"
      >
        <option value="all">Tous</option>
        <option value="active">Actifs</option>
        <option value="inactive">Inactifs</option>
      </select> */}

      {/* Rafraîchir */}
      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
        title="Rafraîchir"
      >
        <RefreshCw className="w-4 h-4" />
        Rafraîchir
      </button>

      {/* Bouton créer aligné à droite, même ligne */}
      <div className="ml-auto">
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouvel utilisateur
        </button>
      </div>
    </div>
  );
}
