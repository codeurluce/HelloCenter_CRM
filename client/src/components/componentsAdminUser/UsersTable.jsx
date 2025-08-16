// src/components/admin/UsersTable.jsx
import React from "react";
import {
  CheckCircle2,
  XCircle,
  Shield,
  Mail,
  Briefcase,
  Pencil,
  Power,
  RefreshCw,
  Loader2,
  Trash,
  Trash2,     // 👈 important
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
}) {
  const Badge = ({ children, className = "" }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Rôle</th>
              <th className="text-left px-4 py-3 font-medium">Univers</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 inline-block animate-spin mr-2" />
                  Chargement…
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Aucun utilisateur.
                </td>
              </tr>
            ) : (
              pageData.map((u) => (
                <tr key={u.id} className="border-t last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {u.firstname} {u.lastname}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      ID&nbsp;{u.id}
                    </div>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
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
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    {u.profil || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.active ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-200 text-gray-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactif
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1.5 rounded-lg border hover:bg-gray-50" onClick={() => openEdit(u)} title="Modifier">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className={`px-3 py-1.5 rounded-lg border hover:bg-gray-50 ${u.active ? "text-amber-700" : "text-green-700"}`}
                        onClick={() => toggleActive(u)}
                        title={u.active ? "Désactiver" : "Activer"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-blue-700"
                        onClick={() => resetPassword(u)}
                        title="Réinitialiser le mot de passe"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {/* bouton supprimer */}
                      <button
                        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-red-700"
                        onClick={() => resetPassword(u)}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
