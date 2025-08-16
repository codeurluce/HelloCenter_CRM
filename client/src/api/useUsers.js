// src/hooks/useUsers.js
import { useEffect, useState, useMemo } from "react";
import axios from "../api/axiosInstance";

/**
 * useUsers hook
 * - roleFilter: string (ex: "Agent")
 * - q: recherche texte
 * - options.clientSideOnly: si true on récupère (au moins) une page et on filtre côté client.
 *    si false on envoie role au backend (normalisé) pour filtrage serveur.
 */
export default function useUsers({ page, limit, roleFilter, q, options = { clientSideOnly: true } }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeForServer = (r) => {
    if (!r) return undefined;
    const t = r.trim();
    // Normalise: première lettre majuscule, reste en minuscules => "Agent", "Manager", "Admin"
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      if (options.clientSideOnly) {
        // récupération sans filtrage côté serveur (plus sûr si tu veux être sûr que le filtre client marche)
        const { data } = await axios.get("/users", { params: { page, limit } });
        const list = data.items ?? data;
        setUsers(Array.isArray(list) ? list : []);
        setTotal(data.total ?? (Array.isArray(list) ? list.length : 0));
      } else {
        // envoie le role normalisé au serveur (si le backend supporte ce param)
        const params = { page, limit };
        if (roleFilter) params.role = normalizeForServer(roleFilter);
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
  }, [page, limit, roleFilter]);

  const filteredUsers = useMemo(() => {
    let result = Array.isArray(users) ? users.slice() : [];

    // Filtre rôle (robuste)
    if (roleFilter) {
      const rf = roleFilter.trim().toLowerCase();
      result = result.filter((u) => (u.role || "").toString().trim().toLowerCase() === rf);
    }

    // Recherche texte
    if (q) {
      const needle = q.trim().toLowerCase();
      result = result.filter(
        (u) =>
          (`${u.firstname || ""} ${u.lastname || ""}`).toLowerCase().includes(needle) ||
          (u.email || "").toLowerCase().includes(needle) ||
          (u.profil || u.univers || "").toLowerCase().includes(needle)
      );
    }

    return result;
  }, [users, roleFilter, q]);

  return { users, filteredUsers, total, loading, error, fetchUsers, setUsers };
}
