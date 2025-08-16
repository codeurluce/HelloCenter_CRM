// src/components/admin/AdministrationUsers.jsx
import React, { useState, useMemo } from "react";
import useUsers from "../../api/useUsers";
import SearchFilterBar from "../componentsAdminUser/SearchFilterBar";
import UsersTable from "../componentsAdminUser/UsersTable";
import UserFormModal from "../componentsAdminUser/UserFormModal";
import axios from "../../api/axiosInstance";

const rolesOptions = [
  { value: "Agent", label: "Agent" },
  { value: "Manager", label: "Manager" },
  { value: "Admin", label: "Admin" },
];

export default function AdministrationUsers() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const { users, filteredUsers, total, loading, error, fetchUsers } = useUsers({
    page,
    limit,
    roleFilter,
    q,
  });

  const totalPages = Math.max(1, Math.ceil((roleFilter || q ? filteredUsers.length : total) / limit));
  const pageData = useMemo(() => {
    const source = roleFilter || q ? filteredUsers : users;
    const start = (page - 1) * limit;
    return source.slice(start, start + limit);
  }, [users, filteredUsers, roleFilter, q, page, limit]);

  const openCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setShowModal(true);
  };

  const handleSave = async (form) => {
    try {
      setSaving(true);
      if (editingUser) {
        await axios.put(`/users/${editingUser.id}`, form);
      } else {
        await axios.post("/users", form);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await axios.patch(`/users/${u.id}`, { active: !u.active });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const resetPassword = async (u) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${u.firstname} ${u.lastname} ?`)) return;
    try {
      await axios.post(`/users/${u.id}/reset-password`);
      alert("Mot de passe réinitialisé !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la réinitialisation");
    }
  };

  return (
    <div className="space-y-4">
      {/* Titre de section (sans bouton à droite) */}
      <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>

      {/* Barre de recherche/filtre + bouton créer à droite (même ligne) */}
      <SearchFilterBar
        q={q}
        setQ={setQ}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        rolesOptions={rolesOptions}
        onRefresh={fetchUsers}
        onCreate={openCreate}
        onResetPage={() => setPage(1)}
      />

      {error && <div className="text-red-600">{error}</div>}

      <UsersTable
        users={users}
        loading={loading}
        pageData={pageData}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        toggleActive={toggleActive}
        openEdit={openEdit}
        resetPassword={resetPassword}
      />

      <UserFormModal
        show={showModal}
        setShow={setShowModal}
        editingUser={editingUser}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
