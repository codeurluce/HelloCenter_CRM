// src/components/admin/UsersTable.jsx
import React from "react";
import {
  Pencil,
  Power,
  RefreshCw,
  Loader2,
  Eye,
} from "lucide-react";

export default function UsersTable({
  users,
  loading,
  pageData,
  toggleActive,
  openEdit,
  resetPassword,
  totalPages,
  page,
  setPage,
  limit,
  setLimit,
  onViewAgent,
  onRefresh
}) {
  const Badge = ({ children, className = "" }) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 py-1 px-3 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition"
        >
          <RefreshCw size={16} /> Rafraîchir
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Nom</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Prénom</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Email</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Rôle</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Univers</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Statut Compte</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-blue-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7}>
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <span className="text-blue-700 font-medium">Chargement des utilisateurs...</span>
                </div>
              </td>
            </tr>
          ) : pageData.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-gray-500 italic">
                Aucun utilisateur.
              </td>
            </tr>
          ) : (
            pageData.map((u) => (
              <tr key={u.id} className="border-t last:border-b-0 hover:bg-blue-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.lastname}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{u.firstname}</td>

                <td className="px-4 py-3 flex items-center gap-2">
                  {u.email}
                </td>

                <td className="px-4 py-3">
                  <Badge
                    className={
                      u.role === "Admin"
                        ? "bg-red-100 text-red-700"
                        : u.role === "Manager"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                    }
                  >
                    {u.role}
                  </Badge>
                </td>

                <td className="px-4 py-3 flex items-center gap-2">
                  {u.profil || "—"}
                </td>

                <td className="px-4 py-3">
                  {u.is_active ? (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-600 inline-block" />
                      Désactivé
                    </Badge>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 items-center">
                    <div className="relative group">
                      <button
                        onClick={() => onViewAgent && onViewAgent(u)}
                        title="Consulter"
                        className="px-3 py-1.5 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white 
                                      transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-105"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-blue-600 text-white text-xs whitespace-nowrap">
                        Consulter
                      </span>
                    </div>

                    <div className="relative group">
                      <button
                        onClick={() => openEdit(u)}
                        title="Modifier"
                        className="px-3 py-1.5 rounded-lg border border-green-100 text-green-600 hover:bg-green-600 hover:text-white
                                      transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-105"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-green-600 text-white text-xs whitespace-nowrap">
                        Modifier
                      </span>
                    </div>

                    <div className="relative group">
                      <button
                        onClick={() => resetPassword(u)}
                        title="Réinitialiser le mot de passe"
                        className="px-3 py-1.5 rounded-lg border border-yellow-100 text-yellow-600 hover:bg-yellow-600 hover:text-white 
                                      transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-105"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-yellow-600 text-white text-xs whitespace-nowrap">
                        Réinitialiser le mot de passe
                      </span>
                    </div>

                    <div className="relative group">
                      <button
                        onClick={() => toggleActive(u)}
                        aria-pressed={u.is_active}
                        title={u.is_active ? "Désactiver le compte" : "Activer le compte"}
                        className={`px-3 py-1.5 rounded-lg border transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 ${u.is_active
                          ? "text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:scale-105"
                          : "text-green-600 border-green-100 hover:bg-green-600 hover:text-white hover:scale-105"
                          }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <span
                        className={`pointer-events-none absolute -top-9 right-0 hidden group-hover:block text-xs whitespace-nowrap px-2 py-1 rounded shadow-lg ${u.is_active ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                          }`}
                      >
                        {u.is_active ? "Désactiver le compte" : "Activer le compte"}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>


      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-gray-50">
        <div className="text-sm text-gray-600">
          Page <strong>{page}</strong> / {totalPages}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            className="px-2 py-1.5 rounded-lg border"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50"
            title="Page précédente"
          >
            ←
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50"
            title="Page suivante"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
