/**
 * src/cards/MonthlySalesChartAdmin
 * ------------------------------------------------------------
 * ➤ Affiche un graphique horizontal des ventes des agents du mois en cours.
 * ➤ Si aucune donnée, affiche les semaines réelles du mois (ex : 40–44).
 */
import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#14B8A6"];

// 🧩 Calcule le numéro ISO de la semaine
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // dimanche = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// 🧩 Retourne les semaines réelles du mois courant
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

// ✅ Tooltip : affiche uniquement les semaines > 0
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const filtered = payload.filter((p) => p.value > 0);
    if (!filtered.length) return null;

    return (
      <div className="bg-white p-2 rounded shadow text-sm">
        <p className="font-medium">{label}</p>
        {filtered.map((p) => (
          <p key={p.dataKey}>
            {p.dataKey} : {p.value} ventes
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => (
  <ul className="flex mt-4 gap-4 flex-wrap">
    {payload.map((item) => (
      <li key={item.value} className="flex items-center gap-2">
        <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            background: item.color,
            borderRadius: 2,
          }}
        />
        <span>{item.value}</span>
      </li>
    ))}
  </ul>
);

const MonthlySalesChartAdmin = () => {
  const [data, setData] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Helper pour extraire le numéro depuis "Semaine 41" -> 41
  const extractWeekNumber = (weekLabel) => {
    if (!weekLabel) return NaN;
    const m = String(weekLabel).match(/\d+/);
    return m ? parseInt(m[0], 10) : NaN;
  };

  useEffect(() => {
    async function fetchMonthlySales() {
      try {
        const { data: result } = await axiosInstance.get(
          "/sales/monthly-agents-charthorizontal"
        );

        // 🔹 Calcule les semaines du mois courant
        const currentMonthWeeks = getWeeksOfCurrentMonth();

        // Si résultat vide → fallback
        if (!result || Object.keys(result).length === 0) {
          setData([]);
          setWeeks(currentMonthWeeks);
          return;
        }

        // 🔹 Collecte toutes les semaines existantes dans le résultat
        const allWeeks = new Set();
        Object.values(result).forEach((agentWeeks) => {
          Object.keys(agentWeeks).forEach((w) => {
            if (w && w.toString().trim()) allWeeks.add(w.toString().trim());
          });
        });

        // 🔹 Trie numériquement
        const sortedWeeks = Array.from(allWeeks).sort(
          (a, b) => extractWeekNumber(a) - extractWeekNumber(b)
        );

        // 🔹 Ajoute les semaines manquantes (ex. semaines du mois non présentes)
        const finalWeeks = Array.from(
          new Set([...sortedWeeks, ...currentMonthWeeks])
        ).sort((a, b) => extractWeekNumber(a) - extractWeekNumber(b));

        // 🔹 Construit les lignes du graphique
        const formattedData = Object.entries(result).map(([agent, weeksObj]) => {
          const row = { agent_name: agent };
          finalWeeks.forEach((week) => {
            const daysObj = weeksObj[week] || {};
            const totalWeek = Object.values(daysObj).reduce(
              (acc, v) => acc + (Number(v) || 0),
              0
            );
            row[week] = totalWeek;
          });
          return row;
        });

        setData(formattedData);
        setWeeks(finalWeeks);
      } catch (err) {
        console.error("❌ Erreur chargement ventes mensuelles :", err);

        // 🔹 En cas d’erreur API : fallback semaines réelles du mois
        const currentMonthWeeks = getWeeksOfCurrentMonth();
        setData([
          {
            agent_name: "Aucun agent",
            ...Object.fromEntries(currentMonthWeeks.map((w) => [w, 0])),
          },
        ]);
        setWeeks(currentMonthWeeks);
      } finally {
        setLoading(false);
      }
    }

    fetchMonthlySales();
  }, []);

  if (loading) return <p>Chargement des ventes mensuelles...</p>;
  if (!data.length) return <div className="bg-white p-6 rounded-2xl shadow w-full h-[300px] flex flex-col items-center justify-center text-center">
      <div className="text-gray-400 text-5xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-gray-700">Aucune donnée disponible</h3>
      <p className="text-gray-500 text-sm mt-2 max-w-sm">
        Aucun enregistrement n’a été trouvé pour ce mois.
        Les semaines s’afficheront automatiquement dès qu’une vente sera enregistrée.
      </p>
    </div>

  return (
    <div className="bg-white p-6 rounded-2xl shadow w-full h-[400px]">
      <h2 className="text-lg font-semibold mb-4">
        Statistiques ventes hebdomadaires par agent
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="agent_name" type="category" />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={<CustomLegend />}
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ width: "100%", display: "flex", justifyContent: "center" }}
          />
          {weeks.map((week, idx) => (
            <Bar
              key={week}
              dataKey={week}
              fill={COLORS[idx % COLORS.length]}
              stackId="a"
              name={week}
              radius={[0, 6, 0, 0]}
              barSize={40}
              animationDuration={500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySalesChartAdmin;
