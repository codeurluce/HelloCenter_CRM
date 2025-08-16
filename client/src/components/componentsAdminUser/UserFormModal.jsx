// src/components/admin/UserFormModal.jsx
import React, { useState, useEffect } from "react";
import { Loader2, User } from "lucide-react";

const rolesOptions = [
  { value: "Agent", label: "Agent" },
  { value: "Manager", label: "Manager" },
  { value: "Admin", label: "Admin" },
];
const universOptions = [
  { value: "Energie", label: "Energie" },
  { value: "OffreMobile", label: "Offre Mobile" },
  { value: "Hybride", label: "Hybride" },
]

export default function UserFormModal({ show, setShow, editingUser, onSave, saving }) {
  const defaultForm = {
    firstname: "",
    lastname: "",
    role: "Agent",
    profil: "",
    is_first_login: true,
  };

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (editingUser) {
      setForm({
        firstname: editingUser.firstname || "",
        lastname: editingUser.lastname || "",
        role: editingUser.role || "Agent",
        profil: editingUser.profil || "",
        is_first_login: editingUser.is_first_login ?? true,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editingUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-3">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {editingUser ? "Modifier l’utilisateur" : "Nouvel utilisateur"}
          </h2>
          <button
            onClick={() => setShow(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prénom + Nom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Prénom</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={form.firstname}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstname: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nom</label>
              <input
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.lastname}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastname: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {/* Rôle + Profil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Rôle</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
                required
              >
                {rolesOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Profil / Univers</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
                required
              >
                {universOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
