import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import AgentDashboard from './pages/AgentPages';
import AdminDashboard from './pages/AdminPages';
import ManagerDashboard from './pages/ManagerPages';
import NotFoundPages from './pages/NotFoundPages';
import { AuthProvider } from './pages/AuthContext';

function AppWrapper() {
  return (
    <AuthProvider>
      <Router>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

function App() {
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('mustChangePassword', newUser.mustChangePassword);

    setToken(newToken);
    setUser(newUser);

    if (newUser.mustChangePassword) {
      navigate('/change-password');
    } else {
      redirectByRole(newUser.role);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const redirectByRole = (role) => {
    switch (role) {
      case 'Agent': navigate('/agent'); break;
      case 'Manager': navigate('/manager'); break;
      case 'Admin': navigate('/admin'); break;
      default: navigate('/'); break;
    }
  };

  // Redirection automatique si token et user
  useEffect(() => {
    if (!token || !user) return;

    const currentPath = window.location.pathname;
    if (user.mustChangePassword && currentPath !== '/change-password') {
      navigate('/change-password');
    } else if (!user.mustChangePassword && currentPath !== routeByRole(user.role)) {
      navigate(routeByRole(user.role));
    }
  }, [token, user, navigate]);

  function routeByRole(role) {
    switch (role) {
      case 'Agent': return '/agent';
      case 'Manager': return '/manager';
      case 'Admin': return '/admin';
      default: return '/';
    }
  }

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
      <Route path="/change-password" element={
        token ? (
          <ChangePassword onPasswordChanged={() => {
            const updatedUser = { ...user, mustChangePassword: false };
            setUser(updatedUser);
            localStorage.setItem('mustChangePassword', 'false');
            localStorage.setItem('user', JSON.stringify(updatedUser));
            redirectByRole(user.role);
          }} />
        ) : <Navigate to="/login" />
      } />
      <Route path="/agent" element={token && user?.role === 'Agent' ? <AgentDashboard onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/manager" element={token && user?.role === 'Manager' ? <ManagerDashboard onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/admin" element={token && user?.role === 'Admin' ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<NotFoundPages />} />
    </Routes>
  );
}

export default AppWrapper;