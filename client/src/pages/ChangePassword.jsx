import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChangePassword = ({ onPasswordChanged }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [reason, setReason] = useState(null);

  useEffect(() => {
    // Essayer de récupérer la raison dans localStorage au chargement
    const storedReason = localStorage.getItem('mustChangePasswordReason');
    if (storedReason) {
      setReason(storedReason);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        'http://localhost:5000/api/change-password-first-login',
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onPasswordChanged) onPasswordChanged();

      localStorage.setItem('mustChangePassword', 'false');
      localStorage.setItem('mustChangePasswordReason', '');

      const role = localStorage.getItem('role');

      if (role === 'Agent') navigate('/agent');
      else if (role === 'Manager') navigate('/manager');
      else if (role === 'Admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 max-w-md w-full bg-white rounded shadow-md">
        <h2 className="text-xl font-bold mb-4 text-center">Changer le mot de passe</h2>
        {reason === 'first_login' && (
          <p className="mb-4 text-center text-blue-700">
            Bienvenue ! Comme c’est votre première connexion, merci de changer votre mot de passe.
          </p>
        )}
        {reason === 'expired' && (
          <p className="mb-4 text-center text-red-700">
            Votre mot de passe a expiré. Veuillez le changer pour continuer.
          </p>
        )}
        {error && <div className="text-red-600 mb-2 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Valider
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;