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
    Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // On prend le segment réellement hover, pas seulement payload[0]
    // payload contient un objet par stack/bar du jour, il faut afficher la bonne valeur
    return (
      <div className="bg-white p-2 rounded shadow text-sm">
        <p className="font-medium">{label}</p>
        {/* Affiche toutes les ventes sur les jours stackés */}
        {payload.map((pl, idx) => (
          pl.value > 0 && (
            <p key={pl.dataKey}>
              {DAY_LABELS_FR[pl.dataKey] || pl.dataKey} : {pl.value}
            </p>
          )
        ))}
      </div>
    );
  }
  return null;
};
const COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6']; // couleurs par jour
const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABELS_FR = {
  Mon: 'Lundi',
  Tue: 'Mardi',
  Wed: 'Mercredi',
  Thu: 'Jeudi',
  Fri: 'Vendredi'
};
const legendPayload = DAY_KEYS.map((day, idx) => ({
  value: DAY_LABELS_FR[day],
  type: 'square',
  color: COLORS[idx],
  id: day
}));

const CustomLegend = () => (
  <ul className="flex mt-4 gap-4">
    {legendPayload.map(item => (
      <li key={item.id} className="flex items-center gap-2">
        <span style={{
          display: "inline-block",
          width: 12,
          height: 12,
          background: item.color,
          borderRadius: 2
        }} />
        <span>{item.value}</span>
      </li>
    ))}
  </ul>
);

// Dans ton BarChart :

const WeeklySalesChartAdmin = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWeeklySales() {
            try {
                // 🔹 Choisir la bonne route selon le rôle
                const { data: result } = await axiosInstance.get('/sales/weekly-agents-charthorizontal');

                // remplir avec les vraies données
                const formattedData = Object.entries(result).map(([agent, ventes]) => ({
                    agent_name: agent,
                    Mon: ventes['Mon'] || 0,
                    Tue: ventes['Tue'] || 0,
                    Wed: ventes['Wed'] || 0,
                    Thu: ventes['Thu'] || 0,
                    Fri: ventes['Fri'] || 0,
                }));
                setData(formattedData);


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
            <h2 className="text-lg font-semibold mb-4">Statistique ventes par agent</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data}>
                    <CartesianGrid strokeDasharray="3 1" />
                    <XAxis type="number" />
                    <YAxis dataKey="agent_name" type="category" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
  content={<CustomLegend />}
  verticalAlign="bottom"
  align="center"
  wrapperStyle={{ width: '100%', display: 'flex', justifyContent: 'center' }}
/>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
                        <Bar key={day} dataKey={day} fill={COLORS[idx]} stackId="a" />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WeeklySalesChartAdmin;
