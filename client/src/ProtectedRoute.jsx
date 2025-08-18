import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  // Récupération du token et user depuis localStorage
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Pas de session => login
  if (!token || !user) return <Navigate to="/login" replace />;

  // Mot de passe à changer => redirection obligatoire
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;

  // Vérification du rôle
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  // Tout est ok => accès autorisé
  return children;
}

export default ProtectedRoute;
