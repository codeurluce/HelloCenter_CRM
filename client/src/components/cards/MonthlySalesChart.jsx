/**
 * src/cards/MonthlySalesChart
 * ------------------------------------------------------------
 * ➤ Affiche un graphique en barres verticales montrant les ventes du mois réparties en semaine pour l'admin.
 * ➤ Permet de comparer les performances des ventes entre les semaines
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
                const { data: result } = await axiosInstance.get('/sales/monthly-agents'); console.log(result); // <-- vérifie ici

                setData(result); // directement, plus de mapping inutile
            } catch (err) {
                console.error("❌ Erreur chargement ventes mensuelles :", err.response?.data || err.message);
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
                <BarChart data={data}
                    margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                        content={<CustomTooltip />}
                    />
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
