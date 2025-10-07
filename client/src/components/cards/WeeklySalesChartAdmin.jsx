/**
 * src/cards/WeeklySalesChartAdmin
 * ------------------------------------------------------------
 * ➤  Afficher un graphique horizontal des ventes des agents [ de la semaine en cours ]
 * ➤  Données issues de /sales/weekly-agents-charthorizontal
 * ➤  Empilement des ventes quotidiennes (Lun → Ven) par agent
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
const COLORS = ['#3B82F6', '#F59E0B', '#22C55E', '#EF4444', '#8B5CF6']; // couleurs par jour
// const COLORS = [
//   '#3B82F6', // base, blue-500
//   '#2F6FD1', // un peu plus foncé
//   '#255BB0', // plus foncé
//   '#1B478F', // foncé
//   '#12366E', // très foncé
// ];




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
        <div className="bg-white p-6 rounded-2xl shadow w-full h-[400px]">
            <h2 className="text-lg font-semibold mb-4">Statistiques ventes quotidiennes par agent</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data}
                    margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="agent_name" type="category" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        content={<CustomLegend />}
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                    />
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
                        <Bar key={day} dataKey={day} fill={COLORS[idx]} stackId="a" radius={[0, 6, 0, 0]}
                            barSize={40}
                            animationDuration={500} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WeeklySalesChartAdmin;
