import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import { CalendarDays, PhoneOutgoing, Clock, CheckCircle, XCircle } from 'lucide-react';

const StatGroup = ({ setActiveItem }) => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('http://localhost:5000/api/sales/today-summary', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();

        setStatsData({
        //   fichesDisponibles: parseInt(data.total_files_today) || 0,
          totalTransactions: parseInt(data.total_sales_today) || 0,
          ventesEnAttente: parseInt(data.pending_sales_today) || 0,
          ventesValidees: parseInt(data.validated_sales_today) || 0,
          ventesAnnulees: parseInt(data.cancelled_sales_today) || 0,
        });
      } catch (error) {
        console.error('Erreur fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);


// useFfect pour aficher la liste total
useEffect(() => {
  async function fetchFilesStats() {
    try {
      const response = await fetch('http://localhost:5000/api/files/today-summary', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      console.log('✅ Fiches nouvelles du jour:', data);

      setStatsData(prev => ({
        ...prev,
        fichesDisponibles: parseInt(data.total_files_today) || 0
      }));
    } catch (error) {
      console.error('Erreur lors du fetch des fiches du jour:', error);
    }
  }

  fetchFilesStats();
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
      title: 'Total des transactions',
      value: statsData.totalTransactions,
      icon: PhoneOutgoing,
      color: 'border-blue-500 text-blue-600',
      onClick: () => setActiveItem('files'),
    },
    {
      title: 'Ventes en attente',
      value: statsData.ventesEnAttente,
      icon: Clock,
      color: 'border-yellow-500 text-yellow-600',
      onClick: () => setActiveItem('sales'),
    },
    {
      title: 'Ventes validées',
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
