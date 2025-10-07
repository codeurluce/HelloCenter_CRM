import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import { 
  CalendarDays, 
  // CheckCircle, 
  // XCircle, 
  BarChart3, 
  // CircleArrowOutUpRight, 
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const StatGroup = ({ setActiveItem }) => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role");
  const isAdminOrManager = role === "Admin" || role === "Manager";

  useEffect(() => {
    async function fetchAllStats() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn("⚠️ Aucun token trouvé dans le localStorage");
          return;
        }

        // Endpoints selon le rôle
        const salesEndpoint = isAdminOrManager
          ? '/sales/admin-summary'
          : '/sales/today-summary';
        const filesEndpoint = isAdminOrManager
          ? '/files/admin-summary'
          : '/files/today-summary';

        const [salesRes, filesRes] = await Promise.all([
          axiosInstance.get(salesEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axiosInstance.get(filesEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const salesData = salesRes.data;
        const filesData = filesRes.data;

        setStatsData({
          totalTransactions: parseInt(salesData.total_sales_today) || 0,
        ventesEnAttente: parseInt(salesData.pending_sales_today) || 0,
        ventesValidees: parseInt(salesData.validated_sales_today) || 0,
        ventesAnnulees: parseInt(salesData.cancelled_sales_today) || 0,
        fichesDisponibles: parseInt(filesData.total_files_today) || 0,
        });
      } catch (error) {
        console.error("❌ Erreur lors du fetch des statistiques :", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAllStats();
  }, [isAdminOrManager]);

  if (loading) return <p>Chargement des statistiques...</p>;
  if (!statsData) return <p>Impossible de charger les données.</p>;

  // ✅ Affichage dynamique des cards
  const stats = isAdminOrManager
    ? [
        {
          title: 'Fiches disponibles (global)',
          value: statsData.fichesDisponibles,
          icon: CalendarDays,
          color: 'border-green-500 text-green-600',
          onClick: () => setActiveItem('files'),
        },
        {
          title: 'Total des ventes (global)',
          value: statsData.totalTransactions,
          icon: BarChart3,
          color: 'border-blue-500 text-blue-600',
          onClick: () => setActiveItem('sales'),
        },
      ]
    : [
        {
          title: 'Fiches disponibles',
          value: statsData.fichesDisponibles,
          icon: CalendarDays,
          color: 'border-green-500 text-green-600',
          onClick: () => setActiveItem('files'),
        },
        {
          title: 'Total des ventes',
          value: statsData.totalTransactions,
          icon: BarChart3,
          color: 'border-blue-500 text-blue-600',
          onClick: () => setActiveItem('sales'),
        },
        {
          title: 'Mes ventes',
          value: statsData.ventesEnAttente,
          icon: BarChart3,
      // icon: CircleArrowOutUpRight,
          color: 'border-yellow-500 text-yellow-600',
          onClick: () => setActiveItem('sales'),
        },
        {
          title: 'Ventes payées',
          value: statsData.ventesValidees,
          icon: BarChart3,
          // icon: CheckCircle,
          color: 'border-green-500 text-green-600',
          onClick: () => setActiveItem('sales'),
        },
        {
          title: 'Ventes annulées',
          value: statsData.ventesAnnulees,
          icon: BarChart3,
          // icon: XCircle,
          color: 'border-red-500 text-red-600',
          onClick: () => setActiveItem('sales'),
        },
      ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${!isAdminOrManager ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-2'} gap-6 w-full`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatGroup;
