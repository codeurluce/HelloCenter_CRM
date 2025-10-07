/**
 * src/cards/MonthlySalesChartAdmin
 * ------------------------------------------------------------
 * ➤  Affiche un graphique horizontal des ventes des agents du mois en cours
 * ➤  Permet à l’admin de comparer les performances par semaine des agents
 * ➤  Données issues de /sales/monthly-agents-charthorizontal.
 * ➤  Empilement des ventes hebdomadaires (Seamine 1 → Semaine 4) par agent
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
    Legend,
} from 'recharts';

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#14B8A6'];

// ✅ Tooltip corrigé : n'affiche que les semaines avec > 0 ventes
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const filtered = payload.filter(p => p.value > 0);
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
        {payload.map(item => (
            <li key={item.value} className="flex items-center gap-2">
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

const MonthlySalesChartAdmin = () => {
    const [data, setData] = useState([]);
    const [weeks, setWeeks] = useState([]);
    const [loading, setLoading] = useState(true);

    // helper : extrait le numéro depuis "Semaine 41" -> 41
    const extractWeekNumber = (weekLabel) => {
        if (!weekLabel) return NaN;
        const m = String(weekLabel).match(/\d+/);
        return m ? parseInt(m[0], 10) : NaN;
    };

    useEffect(() => {
        async function fetchMonthlySales() {
            try {
                const { data: result } = await axiosInstance.get('/sales/monthly-agents-charthorizontal');

                // 1) récupérer toutes les semaines uniques
                const allWeeks = new Set();
                Object.values(result).forEach(agentWeeks => {
                    Object.keys(agentWeeks).forEach(w => {
                        if (w && w.toString().trim()) allWeeks.add(w.toString().trim());
                    });
                });

                // 2) trier NUMÉRIQUEMENT les semaines (Semaine 40, 41, 42 ...)
                const sortedWeeks = Array.from(allWeeks)
                    .sort((a, b) => extractWeekNumber(a) - extractWeekNumber(b));

                // 3) construire les données : une ligne par agent, une colonne par semaine
                const formattedData = Object.entries(result).map(([agent, weeksObj]) => {
                    const row = { agent_name: agent };
                    sortedWeeks.forEach(week => {
                        const daysObj = weeksObj[week] || {};
                        const totalWeek = Object.values(daysObj).reduce((acc, v) => acc + (Number(v) || 0), 0);
                        row[week] = totalWeek;
                    });
                    return row;
                });

                setWeeks(sortedWeeks); // <-- ordre garanti ici
                setData(formattedData);
            } catch (err) {
                console.error("Erreur chargement ventes mensuelles :", err);
            } finally {
                setLoading(false);
            }
        }

        fetchMonthlySales();
    }, []);


    if (loading) return <p>Chargement des ventes mensuelles...</p>;
    if (!data.length) return <p>Aucune donnée disponible.</p>;

    return (
        <div className="bg-white p-6 rounded-2xl shadow w-full h-[400px]">
            <h2 className="text-lg font-semibold mb-4">Statistiques ventes hebdomadaires par agent</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="agent_name" type="category" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />}
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ width: '100%', display: 'flex', justifyContent: 'center' }}
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
                            animationDuration={500} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlySalesChartAdmin;
