import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const ChangePassword = ({ onPasswordChanged }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [reason, setReason] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '', width: '0%' });

  useEffect(() => {
    const storedReason = localStorage.getItem('mustChangePasswordReason');
    if (storedReason) {
      setReason(storedReason);
    }
  }, []);

  const evaluatePasswordStrength = (pwd) => {
    let conditionsMet = 0;

    const conditions = [
      pwd.length >= 8,
      /[A-Z]/.test(pwd),
      /[a-z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    ];

    conditions.forEach(cond => cond && conditionsMet++);

    let label = 'Mot de passe faible';
    let color = 'red';
    let width = '25%';

    if (conditionsMet >= 5) {
      label = 'Mot de passe très fort';
      color = 'green';
      width = '100%';
    } else if (conditionsMet >= 3) {
      label = 'Mot de passe moyen';
      color = 'orange';
      width = '50%';
    }

    return { score: conditionsMet, label, color, width };
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    const strength = evaluatePasswordStrength(pwd);
    setPasswordStrength(strength);
  };

  const validatePassword = (pwd) => {
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    );
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (password !== confirmPassword) {
    setError('Les mots de passe ne correspondent pas.');
    return;
  }

  if (!validatePassword(password)) {
    setError(
      'Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.'
    );
    return;
  }

  setIsSubmitting(true);

  try {
    const token = localStorage.getItem('token');

    await axiosInstance.post('/change-password-first-login',  { password });

    if (onPasswordChanged) onPasswordChanged();

    localStorage.setItem('mustChangePassword', 'false');
    localStorage.setItem('mustChangePasswordReason', '');

    const role = localStorage.getItem('role');
    if (role === 'Agent') navigate('/agent');
    else if (role === 'Manager') navigate('/manager');
    else if (role === 'Admin') navigate('/admin');
    else navigate('/');
  } catch (err) {
    if (
      err.response?.data?.message === "Le nouveau mot de passe ne peut pas être identique à l'ancien."
    ) {
      setError("Vous devez choisir un mot de passe différent de l'ancien.");
    } else {
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 max-w-md w-full bg-white rounded shadow-md">
        <h2 className="text-xl font-bold mb-4 text-center">Changer le mot de passe</h2>
        {/* Bouton retour */}
  {/* <button
    type="button"
    onClick={() => navigate('/login')}
    className="mb-4 text-sm text-blue-600 hover:underline"
  >
    &larr; Retour à la page de connexion
  </button> */}
        {reason === 'first_login' && (
          <p className="mb-4 text-center text-blue-700">
            Bienvenue ! Merci de changer votre mot de passe.
          </p>
        )}
        {reason === 'expired' && (
          <p className="mb-4 text-center text-red-700">
            Mot de passe expiré ! Veuillez le changer pour continuer.
          </p>
        )}
        {error && <div className="text-red-600 mb-2 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={handlePasswordChange}
              required
              className="w-full border p-2 rounded pr-10"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
              tabIndex={-1}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Barre de force avec largeur et couleur dynamiques */}
          <div className="h-2 rounded bg-gray-200">
            <div
              style={{ width: passwordStrength.width }}
              className={`h-2 rounded transition-all duration-300  ${passwordStrength.color === 'green'
                  ? 'bg-green-500'
                  : passwordStrength.color === 'orange'
                    ? 'bg-yellow-400'
                    : 'bg-red-500'
                }`} />

          </div>
          <p
            className={`text-center mt-1 text-sm font-medium ${passwordStrength.color === 'green'
                ? 'text-green-600'
                : passwordStrength.color === 'orange'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
          >
            {passwordStrength.label}
          </p>

          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border p-2 rounded"
            disabled={isSubmitting}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Validation en cours...' : 'Valider'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
