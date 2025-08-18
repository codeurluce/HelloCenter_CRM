// src/components/admin/AdministrationUsers.jsx
import React, { useState, useMemo, useEffect } from "react";
import useUsers from "../../api/useUsers";
import SearchFilterBar from "../componentsAdminUser/SearchFilterBar";
import UsersTable from "../componentsAdminUser/UsersTable";
import UserFormModal from "../componentsAdminUser/UserFormModal";
import AgentDetailsModal from "../componentsAdminUser/AgentDetailsModal";
import axios from "../../api/axiosInstance";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Options de filtres
const rolesOptions = [
  { value: "Agent", label: "Agent" },
  { value: "Manager", label: "Manager" },
  { value: "Admin", label: "Admin" },
];

const profilsOptions = [
  { value: "Energie", label: "Energie" },
  { value: "OffreMobile", label: "Offre Mobile" },
  { value: "Hybride", label: "Hybride" },
];

const statusOptions = [
  { value: "active", label: "Actifs" },
  { value: "inactive", label: "Désactivés" },
];

export default function AdministrationUsers() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [profilFilter, setProfilFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Hook pour récupérer les users
  const { users, filteredUsers, total, loading, error, fetchUsers } = useUsers({
    page,
    limit,
    roleFilter,
    profilFilter,
    statusFilter,
    q,
  });

  const totalPages = Math.max(
    1,
    Math.ceil((roleFilter || profilFilter || statusFilter || q ? filteredUsers.length : total) / limit)
  );

  const pageData = useMemo(() => {
    const source = roleFilter || profilFilter || q || statusFilter ? filteredUsers : users;
    const start = (page - 1) * limit;
    return source.slice(start, start + limit);
  }, [users, filteredUsers, roleFilter, profilFilter, q, statusFilter, page, limit]);

  const openCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSave = async (form) => {
    try {
      setSaving(true);
      if (editingUser) {
        // Modification utilisateur existant
        await axios.put(`/users/${editingUser.id}`, form);
        toast.success("✅ Agent modifié avec succès !");
      } else {
        // Création nouvel utilisateur
        await axios.post("/users/register", form);
        toast.success("✅ Agent créé avec succès !");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user) => {
    try {
      const result = await Swal.fire({
        title: `${user.is_active ? "Désactiver" : "Activer"} l'agent ?`,
        text: `Êtes-vous sûr de vouloir ${user.is_active ? "désactiver" : "activer"} ${user.firstname} ${user.lastname} ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: user.is_active ? '#d33' : '#28a745', // rouge si désactiver, vert si activer
        cancelButtonColor: '#6c757d', // neutre gris
        confirmButtonText: user.is_active ? 'Désactiver' : 'Activer',
        cancelButtonText: 'Annuler',
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        const res = await axios.put(`/users/${user.id}/toggle-active`);
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: res.data.message,
          timer: 2000,
          showConfirmButton: false
        });
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Erreur lors de la mise à jour de l'état de l'utilisateur",
      });
    }
  };



  const resetPassword = async (user) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${user.firstname} ${user.lastname} ?`))
      return;
    try {
      await axios.post(`/users/${user.id}/reset-password`);
      toast.success("Mot de passe réinitialisé !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la réinitialisation du mot de passe");
    }
  };

  return (
    <div className="space-y-4">
      {/* Titre de section */}
      <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>

      {/* Barre de recherche/filtre + bouton créer */}
      <SearchFilterBar
        q={q}
        setQ={setQ}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        rolesOptions={rolesOptions}
        profilFilter={profilFilter}
        setProfilFilter={setProfilFilter}
        profilsOptions={profilsOptions}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={statusOptions}
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
        openEdit={(agent) => openEdit(agent)}
        resetPassword={resetPassword}
        onViewAgent={(agent) => setSelectedAgent(agent)}
      />

      {selectedAgent && (
        <AgentDetailsModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onEdit={() => {
            openEdit(selectedAgent);
            setSelectedAgent(null);
          }}
          onToggleStatus={(agent) => {
            toggleActive(agent);
            setSelectedAgent(null);
          }}
        />
      )}

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
