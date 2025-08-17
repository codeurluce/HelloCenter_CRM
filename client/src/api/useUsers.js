import { useEffect, useState, useMemo } from "react";
import axios from "../api/axiosInstance";

/**
 * useUsers hook
 * - roleFilter: string (ex: "Agent")
 * - profilFilter: string (ex: "Energie")
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
  q,
  options = { clientSideOnly: true },
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
    try {
      setLoading(true);
      setError("");

      if (options.clientSideOnly) {
        // Récupération brute puis filtrage côté client
        const { data } = await axios.get("/users", { params: { page, limit } });
        const list = data.items ?? data;
        setUsers(Array.isArray(list) ? list : []);
        setTotal(data.total ?? (Array.isArray(list) ? list.length : 0));
      } else {
        // Filtrage côté backend (si l’API le gère)
        const params = { page, limit };
        if (roleFilter) params.role = normalizeForServer(roleFilter);
        if (profilFilter) params.profil = normalizeForServer(profilFilter);
        if (q) params.q = q;
        const { data } = await axios.get("/users", { params });
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

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, roleFilter, profilFilter, q]);

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
  }, [users, roleFilter, profilFilter, q]);

  return { users, filteredUsers, total, loading, error, fetchUsers, setUsers };
}