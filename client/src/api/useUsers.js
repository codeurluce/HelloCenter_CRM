/**
 * src/api/useUsers.js
 * ---------------------------------------------------
 * Gère la récupération, le filtrage et la pagination des utilisateurs (agents, admins, etc.)
 * ---------------------------------------------------
 */
import { useEffect, useState, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";

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
  q,
  options = { clientSideOnly: true },
}) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Normalise la casse d’un texte pour correspondre aux filtres backend
  //     Exemple : "agent" → "Agent"
  const normalizeForServer = (val) => {
    if (!val) return undefined;
    const t = val.trim();
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  };

  // 🔹 Fonction principale : récupération des utilisateurs
  //  * Peut opérer en mode :
  //  *  - clientSideOnly (filtrage après récupération)
  //  *  - serverSide (filtrage appliqué dans la requête)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      if (options.clientSideOnly) {
        // Récupération brute puis filtrage côté client
        const { data } = await axiosInstance.get("/users", { params: { page, limit } });
        let list = data.items ?? data;

        // Mapping active pour le filtre statusFilter
        list = list.map(u => ({
          ...u,
          active: u.is_active === true || u.is_active === 1
        }));

        setUsers(Array.isArray(list) ? list : []);
        setTotal(data.total ?? (Array.isArray(list) ? list.length : 0));
      } else {
        // Filtrage côté backend (si l’API le gère)
        const params = { page, limit };
        if (roleFilter) params.role = normalizeForServer(roleFilter);
        if (profilFilter) params.profil = normalizeForServer(profilFilter);
        if (q) params.q = q;

        const { data } = await axiosInstance.get("/users", { params });
        const list = data.items ?? data;

        setUsers(Array.isArray(list) ? list : []);
        setTotal(data.total ?? (Array.isArray(list) ? list.length : 0));
      }
    } catch (e) {
      console.error("fetchUsers error", e);
      setError(e.response?.data?.message || "Erreur lors du chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Chargement initial + rechargement à chaque changement de filtre
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, roleFilter, profilFilter, statusFilter, q]);

  // 🔹 Filtrage client dynamique (utilise useMemo pour optimiser les performances)
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
      result = result.filter(u => {
        if (sf === "active") return u.active === true;
        if (sf === "inactive") return u.active === false;
        return true;
      });
    }

    // Recherche texte
    if (q) {
      const needle = q.trim().toLowerCase();
      result = result.filter(
        (u) =>
          (`${u.firstname || ""} ${u.lastname || ""}`)
            .toLowerCase()
            .includes(needle) ||
          (u.email || "").toLowerCase().includes(needle) ||
          (u.profil || "").toLowerCase().includes(needle) ||
          (u.univers || "").toLowerCase().includes(needle)
      );
    }

    return result;
  }, [users, roleFilter, profilFilter, statusFilter, q]);

  return { users, filteredUsers, total, loading, error, fetchUsers, setUsers };
}
