import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import { CalendarDays, CheckCircle, XCircle, BarChart3, CircleArrowOutUpRight } from 'lucide-react';


const StatGroup = ({ setActiveItem }) => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchAllStats() {
    try {
        console.log(localStorage.getItem('token'));
      const [salesRes, filesRes] = await Promise.all([
        fetch('http://localhost:5000/api/sales/today-summary', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('http://localhost:5000/api/files/today-summary', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      const salesData = await salesRes.json();
      const filesData = await filesRes.json();

      setStatsData({
        totalTransactions: parseInt(salesData.total_sales_today) || 0,
        ventesEnAttente: parseInt(salesData.pending_sales_today) || 0,
        ventesValidees: parseInt(salesData.validated_sales_today) || 0,
        ventesAnnulees: parseInt(salesData.cancelled_sales_today) || 0,
        fichesDisponibles: parseInt(filesData.total_files_today) || 0,
      });

    } catch (error) {
      console.error('Erreur lors du fetch des statistiques :', error);
    } finally {
      setLoading(false);
    }
  }

  fetchAllStats();
}, []);


  if (loading) return <p>Chargement des statistiques...</p>;
  if (!statsData) return <p>Impossible de charger les données.</p>;

  const stats = [
    {
      title: 'Fiches disponibles',
      value: statsData.fichesDisponibles,
      icon: CalendarDays,
      color: 'border-green-500 text-green-600',
      onClick: () => setActiveItem('files'), // correspond au key dans AgentDashboard
    },
    {
      title: 'Total des ventes',
      value: statsData.totalTransactions,
      icon: BarChart3,
      color: 'border-blue-500 text-blue-600',
      onClick: () => setActiveItem('files'),
    },
    {
      title: 'Mes Ventes',
      value: statsData.ventesEnAttente,
      icon: CircleArrowOutUpRight,
      color: 'border-yellow-500 text-yellow-600',
      onClick: () => setActiveItem('sales'),
    },
    {
      title: 'Ventes Payées',
      value: statsData.ventesValidees,
      icon: CheckCircle,
      color: 'border-green-500 text-green-600',
      onClick: () => setActiveItem('sales'),
    },
    {
      title: 'Ventes annulées',
      value: statsData.ventesAnnulees,
      icon: XCircle,
      color: 'border-red-500 text-red-600',
      onClick: () => setActiveItem('sales'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatGroup;
