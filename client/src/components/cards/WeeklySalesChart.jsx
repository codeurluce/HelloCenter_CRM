import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { day: 'Lun', ventes: 12 },
  { day: 'Mar', ventes: 15 },
  { day: 'Mer', ventes: 9 },
  { day: 'Jeu', ventes: 20 },
  { day: 'Ven', ventes: 13 },
  { day: 'Sam', ventes: 17 },
  { day: 'Dim', ventes: 8 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow text-sm">
        <p className="font-medium">{label}</p>
        <p>{`Ventes : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const WeeklySalesChart = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow w-full h-80">
      <h2 className="text-lg font-semibold mb-4">Ventes de la semaine</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="ventes"
            fill="#6366F1"
            radius={[6, 6, 0, 0]}
            barSize={40}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklySalesChart;
