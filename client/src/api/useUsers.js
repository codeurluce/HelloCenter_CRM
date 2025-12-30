import { useEffect, useState, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import Swal from "sweetalert2";

/**
 * useUsers hook
 * - roleFilter: string (ex: "Agent")
 * - profilFilter: string (ex: "Energie")
 * - statusFilter: string ("active" / "inactive")
 * - q: recherche texte
 * - options.clientSideOnly:
 *    true  => récupère tous les users et filtre côté client
 *    false => envoie les filtres au backend
 */
export default function useUsers({
  page,
  limit,
  roleFilter,
  profilFilter,
  statusFilter,
  siteFilter,
  q,
  options = { clientSideOnly: true },
  enabled = true,
}) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeForServer = (val) => {
    if (!val) return undefined;
    const t = val.trim();
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  };

  const fetchUsers = async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError("");

      if (options.clientSideOnly) {
        // Récupération brute puis filtrage côté client
        const { data } = await axiosInstance.get("/users", {
          params: { page, limit },
        });
        let list = data.items ?? data;

        // Mapping active pour le filtre statusFilter
        list = list.map((u) => ({
          ...u,
          active: u.is_active === true || u.is_active === 1,
        }));

        setUsers(Array.isArray(list) ? list : []);
        setTotal(data.total ?? (Array.isArray(list) ? list.length : 0));
      } else {
        // Filtrage côté backend (si l’API le gère)
        const params = { page, limit };
        if (roleFilter) params.role = normalizeForServer(roleFilter);
        if (profilFilter) params.profil = normalizeForServer(profilFilter);
        if (siteFilter) params.site_id = siteFilter;
        if (q) params.q = q;

        const { data } = await axiosInstance.get("/users", { params });
        const list = data.items ?? data;

        setUsers(Array.isArray(list) ? list : []);
        setTotal(data.total ?? (Array.isArray(list) ? list.length : 0));
      }
    } catch (e) {
      console.error("fetchUsers error", e);
      setError(
        e.response?.data?.message ||
          "Erreur lors du chargement des utilisateurs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, page, limit, roleFilter, profilFilter, statusFilter, siteFilter, q]);

  const filteredUsers = useMemo(() => {
    let result = Array.isArray(users) ? users.slice() : [];

    // Filtre rôle
    if (roleFilter) {
      const rf = roleFilter.trim().toLowerCase();
      result = result.filter(
        (u) => (u.role || "").toString().trim().toLowerCase() === rf
      );
    }

    // Filtre profil
    if (profilFilter) {
      const pf = profilFilter.trim().toLowerCase();
      result = result.filter(
        (u) => (u.profil || "").toString().trim().toLowerCase() === pf
      );
    }

    // Filtre actif/désactivé
    if (statusFilter) {
      const sf = statusFilter.trim().toLowerCase();
      result = result.filter((u) => {
        if (sf === "active") return u.active === true;
        if (sf === "inactive") return u.active === false;
        return true;
      });
    }

    if (siteFilter) {
      const sf = siteFilter.toString();
      result = result.filter((u) => u.site_id?.toString() === sf);
    }

    // Recherche texte
    if (q) {
      const needle = q.trim().toLowerCase();
      result = result.filter(
        (u) =>
          `${u.firstname || ""} ${u.lastname || ""}`
            .toLowerCase()
            .includes(needle) ||
          (u.email || "").toLowerCase().includes(needle) ||
          (u.profil || "").toLowerCase().includes(needle) ||
          (u.univers || "").toLowerCase().includes(needle)
      );
    }

    return result;
  }, [users, roleFilter, profilFilter, statusFilter, siteFilter, q]);

  const toggleUserActive = async (user) => {
    try {
      const result = await Swal.fire({
        title: `${user.is_active ? "Désactiver" : "Activer"} l'agent ?`,
        text: `Êtes-vous sûr de vouloir ${
          user.is_active ? "désactiver" : "activer"
        } ${user.firstname} ${user.lastname} ?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: user.is_active ? "#d33" : "#28a745",
        cancelButtonColor: "#6c757d",
        confirmButtonText: user.is_active ? "Désactiver" : "Activer",
        cancelButtonText: "Annuler",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        const res = await axiosInstance.put(`/users/${user.id}/toggle-active`);
        await Swal.fire({
          icon: "success",
          title: "Succès",
          text: res.data.message || "Statut mis à jour avec succès",
          timer: 2000,
          showConfirmButton: false,
        });

        // Mise à jour locale sans refetch complet :
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, is_active: !u.is_active, active: !u.active }
              : u
          )
        );

        return res.data;
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      await Swal.fire({
        icon: "error",
        title: "Erreur",
        text:
          err.response?.data?.message ||
          "Erreur lors de la mise à jour du statut de l'utilisateur",
      });
      throw err;
    }
  };

  return {
    users,
    filteredUsers,
    total,
    loading,
    error,
    fetchUsers,
    setUsers,
    toggleUserActive,
  };
}
