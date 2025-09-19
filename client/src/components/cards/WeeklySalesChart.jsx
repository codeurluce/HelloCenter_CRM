import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchWeeklySales() {
    try {
      const { data: result } = await axiosInstance.get('/sales/weekly');
      console.log('Données reçues:', result);

      // jours de la semaine (Jusqu'à Dimanche = 0)
    //   const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    //   const dayIndexToGetDay = [1, 2, 3, 4, 5, 6, 0];


    // jours de la semaine (Jusqu'à Vendredi = 0)
      const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
      const dayIndexToGetDay = [1, 2, 3, 4, 5];

      // on crée une base avec 0 ventes pour chaque jour
      const emptyWeekData = daysOfWeek.map((day) => ({ day, ventes: 0 }));

      // on remplit avec les vraies données reçues du backend
      const formattedData = emptyWeekData.map((dayEntry, index) => {
        const targetDay = dayIndexToGetDay[index];
        const found = result.find(r => {
          const date = new Date(r.date);
          return date.getDay() === targetDay;
        });
        return found
          ? { day: dayEntry.day, ventes: parseInt(found.validated_sales, 10) }
          : dayEntry;
      });

      setData(formattedData);
    } catch (err) {
      console.error(
          "❌ Erreur chargement ventes de la semaine :",
          err.response?.data || err.message
        );
    } finally {
      setLoading(false);
    }
  }

  fetchWeeklySales();
}, []);

  if (loading) return <p>Chargement des ventes de la semaine...</p>;
  if (!data.length) return <p>Aucune donnée disponible.</p>;

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
            animationDuration={5000}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklySalesChart;