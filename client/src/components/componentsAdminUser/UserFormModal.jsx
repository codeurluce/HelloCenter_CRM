// src/components/admin/UserFormModal.jsx
import React, { useState, useEffect } from "react";
import { Loader2, User, UserPlus, UserPen, X } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

const rolesOptions = [
  { value: "Agent", label: "Agent" },
  { value: "Manager", label: "Manager" },
  { value: "Admin", label: "Admin" },
];

const universOptions = [
  { value: "Energie", label: "Energie" },
  { value: "OffreMobile", label: "Offre Mobile" },
  { value: "Hybride", label: "Hybride" },
];

export default function UserFormModal({ show, setShow, editingUser, onSave, saving }) {
  const defaultForm = {
    firstname: "",
    lastname: "",
    role: "Agent",
    profil: "Energie",
    is_first_login: true,
  };

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (show) {
      if (editingUser) {
        setForm({
          firstname: editingUser.firstname || "",
          lastname: editingUser.lastname || "",
          email: editingUser.email || "",
          role: editingUser.role || "Agent",
          profil: editingUser.profil || "Energie",
          is_first_login: editingUser.is_first_login ?? true,
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [editingUser, show]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    onSave(form);

    try {
      // Envoi des données modifiées au backend
      const res = await axiosInstance.put(`/users/${editingUser.id}/update`, {
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        role: form.role,
        profil: form.profil,
      });

      onSave(res.data); // mettre à jour la liste frontend
      setShow(false);
    } catch (err) {
      console.error("Erreur update user:", err.response?.data || err.message);
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3"
      onClick={() => setShow(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {editingUser ? <UserPen size={22} /> : <UserPlus size={22} />}
            <h3 className="text-lg font-bold">
              {editingUser ? "Modifier l’utilisateur" : "Nouvel utilisateur"}
            </h3>
          </div>
          <button
            onClick={() => setShow(false)}
            aria-label="Fermer"
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
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


          {/* Email */}
          {editingUser && (
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.email || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                required
              />
            </div>
          )}

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
                value={form.profil}
                onChange={(e) =>
                  setForm((f) => ({ ...f, profil: e.target.value }))
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
