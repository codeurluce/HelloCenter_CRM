/**
 * src/api/ProtectedRoute.jsx
 * ---------------------------------------------------
 * Composant de route protégée (React Router)
 *
 * Objectif :
 * - Vérifier si l'utilisateur est authentifié avant d'accéder à une page
 * - (Optionnel) Restreindre l'accès à certains rôles spécifiques
 * 
 * Si l'utilisateur n'est pas connecté ou ne possède pas le bon rôle,
 * il est redirigé vers la page de connexion.
 * ---------------------------------------------------
 */
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../pages/AuthContext";

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useContext(AuthContext);

  // Pas d’utilisateur → redirige login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si on a défini des rôles autorisés → on vérifie
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
