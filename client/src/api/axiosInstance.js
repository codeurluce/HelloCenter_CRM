// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // ✅ S'adapte à local/prod
  headers: {
    'Content-Type': 'application/json',
  },
});

// (Optionnel) : Intercepteur pour ajouter automatiquement un token si tu en as un
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
