/**
 * src/cards/MonthlySalesChart
 * ------------------------------------------------------------
 * ➤ Affiche les ventes hebdomadaires du mois en cours.
 * ➤ Si aucune vente, affiche les semaines réelles du mois (ex : semaines 40 à 43).
 */
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

// 🧩 Fonction pour obtenir le numéro ISO de la semaine
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Dimanche = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// 🧩 Fonction pour générer les semaines du mois courant
function getWeeksOfCurrentMonth() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startWeek = getWeekNumber(firstDay);
  const endWeek = getWeekNumber(lastDay);

  const weeks = [];
  for (let w = startWeek; w <= endWeek; w++) {
    weeks.push(`Semaine ${w}`);
  }
  return weeks;
}

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

const MonthlySalesChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMonthlySales() {
      try {
        const { data: result } = await axiosInstance.get('/sales/monthly-agents');
        const currentMonthWeeks = getWeeksOfCurrentMonth();

        let formattedData = [];

        if (!result || !result.length) {
          // 🔹 Si aucune vente, on affiche les semaines réelles du mois
          formattedData = currentMonthWeeks.map((w) => ({
            week: w,
            ventes: 0,
          }));
        } else {
          // 🔹 Ajoute les semaines manquantes avec 0 ventes
          const existingWeeks = result.map((r) => r.week);
          const missingWeeks = currentMonthWeeks.filter(
            (w) => !existingWeeks.includes(w)
          );

          formattedData = [
            ...result,
            ...missingWeeks.map((w) => ({ week: w, ventes: 0 })),
          ].sort((a, b) => {
            const numA = parseInt(a.week.match(/\d+/)?.[0] || '0', 10);
            const numB = parseInt(b.week.match(/\d+/)?.[0] || '0', 10);
            return numA - numB;
          });
        }

        setData(formattedData);
      } catch (err) {
        console.error('❌ Erreur chargement ventes mensuelles :', err);
        // 🔹 En cas d’erreur API, on affiche quand même les semaines du mois courant
        const currentMonthWeeks = getWeeksOfCurrentMonth();
        setData(currentMonthWeeks.map((w) => ({ week: w, ventes: 0 })));
      } finally {
        setLoading(false);
      }
    }

    fetchMonthlySales();
  }, []);

  if (loading) return <p>Chargement des ventes de la semaine...</p>;
  if (!data.length) return <p>Aucune donnée disponible.</p>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow w-full h-[400px]">
      <h2 className="text-lg font-semibold mb-4">Ventes hebdomadaires globales</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="ventes"
            fill="#3B82F6"
            radius={[6, 6, 0, 0]}
            barSize={40}
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySalesChart;
