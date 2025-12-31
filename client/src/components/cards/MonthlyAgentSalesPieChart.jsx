/**
 * src/cards/MonthlyAgentSalesPieChart
 * ----------------------------------------------------------
 * ➤ Afficher un diagramme circulaire représentant la répartition des ventes mensuelles par agent (tous agents confondus).
 * ➤ Montrer un classement des agents selon leur performance.
 */

//  ------------------------------------ Version post finale simplifiee ------------------------------------------
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import axiosInstance from "../../api/axiosInstance";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA46BE", "#33A1FD"];
const PODIUM_ICONS = ["🏆", "🥈", "🥉"];

export default function MonthlyAgentSalesPieChart() {
  const [data, setData] = useState([]);
  const currentMonth = new Date().toLocaleString("fr-FR", { month: "long" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 📡 Appel API réel
        const res = await axiosInstance.get("/sales/monthly-agents-charthorizontal");
        const result = res.data;

        // 🧮 Calcul du total des ventes par agent
        const agentTotals = Object.entries(result).map(([agent, weeks]) => {
          const total = Object.values(weeks).reduce((sum, daysObj) => {
            return sum + Object.values(daysObj).reduce((a, b) => a + b, 0);
          }, 0);
          return { name: agent, value: total };
        });

        // 🔹 Filtrer ceux sans ventes
        const filtered = agentTotals.filter(a => a.value > 0);
        const totalAll = filtered.reduce((a, b) => a + b.value, 0);

        if (totalAll === 0) {
          setData([{ name: "Aucun agent", value: 1, percent: 100 }]);
        } else {
          const withPercent = filtered.map(a => ({
            ...a,
            percent: ((a.value / totalAll) * 100).toFixed(1),
          }));
          withPercent.sort((a, b) => b.value - a.value);
          setData(withPercent);
        }
      } catch (err) {
        console.error("Erreur chargement ventes:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white shadow rounded-2xl p-6 flex flex-col items-center w-full">
      <h2 className="text-lg font-semibold mb-6 text-center">
        Top Vendeur 🌟 du mois : {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}
      </h2>
      <div className="flex flex-col md:flex-row justify-center items-center gap-10 w-full max-w-6xl">
        {/* 📊 Graphique en donut */}
        <div className="w-full md:w-1/2 h-96 flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}   // 🔘 trou central (donut)
                outerRadius={100}
                paddingAngle={2}
                isAnimationActive={true}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={entry.name === "Aucun agent" ? "#E5E7EB" : COLORS[idx % COLORS.length]}
                    stroke="#fff"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => {
                  const pct = props.payload.percent;
                  return [
                    data.length === 1 && name === "Aucun agent"
                      ? "Pas de ventes réalisées"
                      : `${pct}% du total (${value} ventes)`,
                    name,
                  ];
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 🏅 Classement des agents */}
        <div className="w-full md:w-1/2 flex flex-col items-start justify-center">
          <h3 className="font-semibold text-lg mb-3">🏅 Classement des agents</h3>
          <ol className="list-decimal ml-5 space-y-2 text-sm">
            {data.length === 1 && data[0].name === "Aucun agent" ? (
              <li>Aucun agent</li>
            ) : (
              data.map((agent, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  {idx < 3 ? <span className="text-xl">{PODIUM_ICONS[idx]}</span> : <span className="w-5" />}
                  <span>
                    <strong>{agent.name}</strong> — {agent.value} ventes ({agent.percent}%)
                  </span>
                </li>
              ))
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}






// ------------------------------------ Version initiale ------------------------------------------
// import React, { useEffect, useState } from "react";
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
// import axiosInstance from "../../api/axiosInstance";


// const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', "#FF8042", '#AA46BE'];
// const PODIUM_ICONS = ["🏆", "🥈", "🥉"];

// export default function MonthlyAgentSalesPieChart() {
//   const [data, setData] = useState([]);
//   const currentMonth = new Date().toLocaleString("fr-FR", { month: "long" });

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // 📡 Appel API réel
//         const res = await axiosInstance.get("/sales/monthly-agents-charthorizontal");
//         const result = res.data;

//         // 🧮 Calcul du total des ventes par agent
//         const agentTotals = Object.entries(result).map(([agent, weeks]) => {
//           const total = Object.values(weeks).reduce((sum, daysObj) => {
//             return sum + Object.values(daysObj).reduce((a, b) => a + b, 0);
//           }, 0);
//           return { name: agent, value: total };
//         });

//         // 🔹 Filtrer ceux sans ventes
//         const filtered = agentTotals.filter(a => a.value > 0);
//         const totalAll = filtered.reduce((a, b) => a + b.value, 0);

//         if (totalAll === 0) {
//           setData([{ name: "Aucun agent", value: 1, percent: 100 }]);
//         } else {
//           const withPercent = filtered.map(a => ({
//             ...a,
//             percent: ((a.value / totalAll) * 100).toFixed(1),
//           }));
//           withPercent.sort((a, b) => b.value - a.value);
//           setData(withPercent);
//         }
//       } catch (err) {
//         console.error("Erreur chargement ventes:", err);
//       }
//     };

//     fetchData();
//   }, []);

//   return (
//     <div className="bg-white shadow rounded-2xl p-6 flex flex-col items-center w-full">
//       <h2 className="text-lg font-semibold mb-6 text-center">
//         Top Vendeur 🌟 du mois : {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}
//       </h2>
//       <div className="flex flex-col md:flex-row justify-center items-center gap-10 w-full max-w-6xl">
//         <div className="w-full md:w-1/2 h-96 flex justify-center items-center">
//           <ResponsiveContainer width="100%" height="100%">
//             <PieChart>
//               <Pie
//                 data={data}
//                 dataKey="value"
//                 nameKey="name"
//                 cx="50%"
//                 cy="50%"
//                 outerRadius={120}
//               >
//                 {data.map((entry, idx) => (
//                   <Cell
//                     key={`cell-${idx}`}
//                     fill={entry.name === "Aucun agent" ? "#E5E7EB" : COLORS[idx % COLORS.length]}
//                     stroke="#fff"
//                   />
//                 ))}
//               </Pie>
//               <Tooltip
//                 formatter={(value, name, props) => {
//                   const pct = props.payload.percent;
//                   return [
//                     data.length === 1 && name === "Aucun agent"
//                       ? "Pas de ventes réalisées"
//                       : `${pct}% du total (${value} ventes)`,
//                     name,
//                   ];
//                 }}
//               />
//               <Legend verticalAlign="bottom" height={36} />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="w-full md:w-1/2 flex flex-col items-start justify-center">
//           <h3 className="font-semibold text-lg mb-3">🏅 Classement des agents</h3>
//           <ol className="list-decimal ml-5 space-y-2 text-sm">
//             {data.length === 1 && data[0].name === "Aucun agent" ? (
//               <li>Aucun agent</li>
//             ) : (
//               data.map((agent, idx) => (
//                 <li key={idx} className="flex items-center gap-2">
//                   {idx < 3 ? <span className="text-xl">{PODIUM_ICONS[idx]}</span> : <span className="w-5" />}
//                   <span>
//                     <strong>{agent.name}</strong> — {agent.value} ventes ({agent.percent}%)
//                   </span>
//                 </li>
//               ))
//             )}
//           </ol>
//         </div>
//       </div>
//     </div>
//   );
// }