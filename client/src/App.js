import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AgentDashboard from './pages/AgentPages';
import NotFoundPages from './pages/NotFoundPages';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  const handleLogin = () => {
    setIsAuthenticated(true);
    setRole(localStorage.getItem('role'));
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          !isAuthenticated ? <Login onLogin={handleLogin} /> :
          role === 'Agent' ? <Navigate to="/agent" /> :
          <NotFoundPages />
        } />
        <Route
          path="/agent"
          element={isAuthenticated && role === 'Agent' ? <AgentDashboard /> : <Navigate to="/" />}
        />
        <Route path="*" element={<NotFoundPages />} />
      </Routes>
    </Router>
  );
}

export default App;
