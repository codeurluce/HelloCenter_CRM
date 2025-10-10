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
                const { data: result } = await axiosInstance.get('/sales/monthly-agents');

                // 🧩 Si aucune donnée, on crée un mois "vide"
                let formattedData = result;

                if (!result || !result.length) {
                    // 🔹 Valeurs par défaut : 4 semaines avec 0 ventes
                    formattedData = [
                        { week: 'Semaine 1', ventes: 0 },
                        { week: 'Semaine 2', ventes: 0 },
                        { week: 'Semaine 3', ventes: 0 },
                        { week: 'Semaine 4', ventes: 0 },
                    ];
                } else {
                    // 🔹 S’assure que chaque semaine manquante ait 0 ventes
                    const allWeeks = ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'];
                    const existingWeeks = result.map(r => r.week);
                    const missingWeeks = allWeeks.filter(w => !existingWeeks.includes(w));

                    // Ajoute les semaines manquantes à 0
                    formattedData = [
                        ...result,
                        ...missingWeeks.map(w => ({ week: w, ventes: 0 })),
                    ];

                    // Trie par ordre croissant de numéro de semaine
                    formattedData.sort((a, b) => {
                        const numA = parseInt(a.week.match(/\d+/)?.[0] || '0', 10);
                        const numB = parseInt(b.week.match(/\d+/)?.[0] || '0', 10);
                        return numA - numB;
                    });
                }

                setData(formattedData);
            } catch (err) {
                console.error(
                    "❌ Erreur chargement ventes mensuelles :",
                    err.response?.data || err.message
                );

                // 🔹 En cas d’erreur API, on affiche un mois vide
                setData([
                    { week: 'Semaine 1', ventes: 0 },
                    { week: 'Semaine 2', ventes: 0 },
                    { week: 'Semaine 3', ventes: 0 },
                    { week: 'Semaine 4', ventes: 0 },
                ]);
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
