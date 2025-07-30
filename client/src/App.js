import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import AgentDashboard from './pages/AgentPages';
import AdminPages from './pages/AdminPages';
import NotFoundPages from './pages/NotFoundPages';
import { AuthProvider } from './pages/AuthContext';

function AppWrapper() {
  return (
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  );
}

function App() {
  const navigate = useNavigate(); // ✅ hook ici
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  const handleLogin = () => {
    setIsAuthenticated(true);
    setRole(localStorage.getItem('role'));
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setRole(null);
    navigate('/login'); // ✅ fonctionne maintenant
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Login onLogin={handleLogin} />
          ) : role === 'Agent' ? (
            <Navigate to="/agent" />
          ) : role === 'Manager' ? (
            <Navigate to="/admin" />
          ) : role === 'admin+' ? (
            <Navigate to="/admin-plus" />
          ) : (
            <NotFoundPages />
          )
        }
      />

      <Route
        path="/agent"
        element={
          isAuthenticated && role === 'Agent' ? (
            <AgentDashboard onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/admin"
        element={
          isAuthenticated && role === 'Manager' ? (
            <AdminPages onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* <Route
        path="/admin-plus"
        element={
          isAuthenticated && role === 'admin+' ? (
            <SuperAdminPages onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      /> */}

      <Route path="*" element={<NotFoundPages />} />
    </Routes>
  );
}

export default AppWrapper;
