import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import ProtectedRoute from './api/ProtectedRoute';
import { AgentStatusProvider } from "./api/AgentStatusContext"
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import AgentDashboard from './pages/AgentPages';
import AdminDashboard from './pages/AdminPages';
import ManagerDashboard from './pages/ManagerPages';
import { AuthProvider } from './pages/AuthContext';

function AppWrapper() {
  return (
    <AuthProvider>
      <Router>
            <AgentStatusProvider>
      <App />
    </AgentStatusProvider>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

const routeByRole = (role) => {
  switch (role) {
    case 'Agent': return '/agent';
    case 'Manager': return '/manager';
    case 'Admin': return '/admin';
    default: return '/';
  }
};

const App = () => {
  const navigate = useNavigate();

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  // ✅ Redirection automatique au refresh
useEffect(() => {
  if (!token || !user) return;

  const currentPath = window.location.pathname;

  // ✅ Cas 1 : refresh sur une route déjà correcte (/agent, /agent/files, etc.)
  // 👉 on ne fait rien → React Router charge cette page normalement

  // ✅ Cas 2 : user est loggé mais est resté sur "/" ou "/login"
  if (currentPath === "/" || currentPath === "/login") {
    const target = user.mustChangePassword
      ? "/change-password"
      : routeByRole(user.role);
    navigate(target, { replace: true }); // redirection uniquement dans ce cas
  }
}, [token, user]);

  const handleLogin = (newToken, newUser, mustChangePasswordObj) => {
    const updatedUser = { 
      ...newUser, 
      mustChangePassword: mustChangePasswordObj.required, 
      mustChangePasswordReason: mustChangePasswordObj.reason 
    };

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('mustChangePassword', mustChangePasswordObj.required);
    localStorage.setItem('mustChangePasswordReason', mustChangePasswordObj.reason);

    setToken(newToken);
    setUser(updatedUser);

    if (mustChangePasswordObj.required) {
      navigate('/change-password', { replace: true });
    } else {
      navigate(routeByRole(updatedUser.role), { replace: true });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <Routes>
      {/* ✅ Login corrigé */}
      <Route path="/login" element={<Login onLogin={handleLogin} />} />

      <Route path="/change-password" element={
        user?.mustChangePassword ? (
          <ChangePassword onPasswordChanged={() => {
            const updatedUser = { ...user, mustChangePassword: false };
            setUser(updatedUser);
            localStorage.setItem('mustChangePassword', 'false');
            localStorage.setItem('user', JSON.stringify(updatedUser));
            navigate(routeByRole(user.role), { replace: true });
          }} />
        ) : <Navigate to="/" replace />
      } />

      <Route path="/agent" element={
        <ProtectedRoute roles={['Agent']}>
          <AgentDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/manager" element={
        <ProtectedRoute roles={['Manager']}>
          <ManagerDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute roles={['Admin']}>
          <AdminDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="*" element={ token && user?.role ? <Navigate to={routeByRole(user.role)} replace /> : <Navigate to="/login" replace /> } />
    </Routes>
  );
};

export default AppWrapper;
