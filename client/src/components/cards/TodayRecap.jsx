import React, { useEffect, useState } from 'react';

const TodayRecap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTodayData() {
      try {
        const response = await fetch('http://localhost:5000/api/sales/today-summary', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});
        const result = await response.json();
        console.log('Résultat API:', result);

        const formattedData = {
          pending: parseInt(result.pending_sales_today),
          validated: parseInt(result.validated_sales_today),
          cancelled: parseInt(result.cancelled_sales_today),
        };

        setData(formattedData);
      } catch (err) {
        console.error('Erreur chargement ventes du jour', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTodayData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        <span className="ml-3 text-gray-600">Chargement des statistiques...</span>
      </div>
    );
  }

  if (!data) return <p>Impossible de charger les données.</p>;

  const total = data.pending + data.validated + data.cancelled;

  const getPercentage = (count) =>
    total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
      <h2 className="text-lg font-semibold mb-4">Statistiques du jour</h2>

      {/* Résumé haut */}
      <div className="flex justify-between text-center mb-6">
        <div>
          <p className="text-blue-600 font-bold text-lg">{total}</p>
          <p className="text-sm text-gray-600">Total</p>
        </div>
        <div>
          <p className="text-yellow-600 font-bold text-lg">{data.pending}</p>
          <p className="text-sm text-gray-600">Ventes</p>
          <p className="text-xs text-gray-500">{getPercentage(data.pending)}%</p>
        </div>
        <div>
          <p className="text-green-600 font-bold text-lg">{data.validated}</p>
          <p className="text-sm text-gray-600">Payées</p>
          <p className="text-xs text-gray-500">{getPercentage(data.validated)}%</p>
        </div>
        <div>
          <p className="text-red-600 font-bold text-lg">{data.cancelled}</p>
          <p className="text-sm text-gray-600">Annulées</p>
          <p className="text-xs text-gray-500">{getPercentage(data.cancelled)}%</p>
        </div>
      </div>

      {/* Barres de progression */}
      <div className="space-y-3">
        <ProgressBar label="En attente" color="yellow" percent={getPercentage(data.pending)} />
        <ProgressBar label="Validées" color="green" percent={getPercentage(data.validated)} />
        <ProgressBar label="Annulées" color="red" percent={getPercentage(data.cancelled)} />
      </div>
    </div>
  );
};

const ProgressBar = ({ label, percent, color }) => {
  const barColor = {
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
    red: 'bg-red-500',
  }[color];

  return (
    <div>
      <div className="flex justify-between text-sm text-gray-700 mb-1">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default TodayRecap;