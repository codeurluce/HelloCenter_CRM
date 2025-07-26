import React from 'react';
import StatCard from './StatCard';
import { CalendarDays, PhoneOutgoing, Clock, CheckCircle, XCircle } from 'lucide-react';

const StatGroup = () => {
  const stats = [
    {
      title: 'Fiches disponibles',
      value: 42,
      icon: CalendarDays,
      color: 'border-green-500 text-green-600',
      to: '/fichiers',
    },
    {
      title: 'Total des transactions',
      value: 135,
      icon: PhoneOutgoing,
      color: 'border-blue-500 text-blue-600',
      to: '/ventes',
    },
    {
      title: 'Ventes en attente',
      value: 10,
      icon: Clock,
      color: 'border-yellow-500 text-yellow-600',
      to: '/ventes',
    },
    {
      title: 'Ventes validées',
      value: 120,
      icon: CheckCircle,
      color: 'border-green-500 text-green-600',
      to: '/ventes',
    },
    {
      title: 'Ventes annulées',
      value: 5,
      icon: XCircle,
      color: 'border-red-500 text-red-600',
      to: '/ventes',
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
