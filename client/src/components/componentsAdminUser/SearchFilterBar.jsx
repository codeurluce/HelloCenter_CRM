// src/components/admin/SearchFilterBar.jsx
import React from "react";
import { Search, RefreshCw, Plus } from "lucide-react";

export default function SearchFilterBar({
  q,
  setQ,
  rolesOptions,
  roleFilter,
  setRoleFilter,

  profilsOptions,
  profilFilter,
  setProfilFilter,

  statusOptions,
  statusFilter,
  setStatusFilter,

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

      {/* Filtre profil */}
      <select
        value={profilFilter}
        onChange={(e) => {
          setProfilFilter(e.target.value);
          onResetPage?.();
        }}
        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none"
      >
        <option value="">Tous les profils</option>
        {profilsOptions.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

     <select
  value={statusFilter}
  onChange={(e) => { setStatusFilter(e.target.value); onResetPage?.();}}
  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none"
>
  <option value="">Tous les status</option>
  <option value="active">Actifs</option>
  <option value="inactive">Désactivés</option>
</select>
      {/* Rafraîchir */}
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 py-1 px-3 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition"
        title="Rafraîchir"
      >
        <RefreshCw className="w-4 h-4" />
        Rafraîchir
      </button>

      {/* Bouton créer aligné à droite */}
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