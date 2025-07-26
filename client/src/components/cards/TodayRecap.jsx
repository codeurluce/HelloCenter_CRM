import React from 'react';

const TodayRecap = ({ data = { pending: 10, validated: 120, cancelled: 5 } }) => {
  const total = Number(data.pending) + Number(data.validated) + Number(data.cancelled);

  const getPercentage = (count) =>
    total === 0 ? 0 : Math.round((Number(count) / total) * 100);

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
          <p className="text-sm text-gray-600">En attente</p>
          <p className="text-xs text-gray-500">{getPercentage(data.pending)}%</p>
        </div>
        <div>
          <p className="text-green-600 font-bold text-lg">{data.validated}</p>
          <p className="text-sm text-gray-600">Validées</p>
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
