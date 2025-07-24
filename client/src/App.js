// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AgentPages from './pages/AgentPages';
// import AdminPages from './pages/AdminPages';
// import SuperAdminPages from './pages/SuperAdminPages';
import NotFoundPages from './pages/NotFoundPages';

const isAuthenticated = !!localStorage.getItem('token');
const role = localStorage.getItem('role');

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          !isAuthenticated ? <Login /> :
            role === 'agent' ? <Navigate to="/agent" /> :
            // role === 'admin' ? <Navigate to="/admin" /> :
            // role === 'admin+' ? <Navigate to="/superadmin" /> :
            <NotFoundPages />
        } />

        <Route path="/agent" element={isAuthenticated && role === 'agent' ? <AgentPages /> : <Navigate to="/" />} />
        {/* <Route path="/admin" element={isAuthenticated && role === 'admin' ? <AdminPages /> : <Navigate to="/" />} />
        <Route path="/superadmin" element={isAuthenticated && role === 'admin+' ? <SuperAdminPages /> : <Navigate to="/" />} /> */}

        <Route path="*" element={<NotFoundPages />} />
      </Routes>
    </Router>
  );
}

export default App;
