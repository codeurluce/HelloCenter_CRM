import React, { useState, useContext } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import axiosInstance from '../api/axiosInstance';
import { useAgentStatus } from '../api/AgentStatusContext';

const Login = ({ onLogin }) => {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginAgent } = useAgentStatus();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/login', formData);
      const { user, token, mustChangePassword } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      // localStorage.setItem('univers', user.profil);
      // localStorage.setItem('mustChangePassword', mustChangePassword);
      // localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      loginAgent(user, mustChangePassword);
      // ⚡ Notifie le backend que l'agent est connecté

      if (onLogin) onLogin(token, user, mustChangePassword);

      if (mustChangePassword) {
        navigate('/change-password');
      } else {
        switch (user.role) {
          case 'Agent':
            navigate('/agent');
            break;
          case 'Manager':
            navigate('/manager');
            break;
          case 'Admin':
            navigate('/admin');
            break;
          default:
            setError('Rôle utilisateur inconnu.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants invalides.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">CRM</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900" translate="no">Hello Center</h2>
          <p className="text-gray-600 mt-2">Veuillez vous connecter à votre compte</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez votre email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <span className="ml-2 text-gray-700">Se souvenir de moi</span>
            </label>
            <button type="button"
              onClick={() => {
                localStorage.setItem("resetMode", "true");
                navigate('/change-password');
              }}
              className="text-blue-600 hover:underline"
            >Mot de passe oublié ?</button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connexion...
              </div>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;