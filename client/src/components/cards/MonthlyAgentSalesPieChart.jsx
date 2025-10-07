/**
 * src/cards/MonthlyAgentSalesPieChart
 * ----------------------------------------------------------
 * ➤ Afficher un diagramme circulaire représentant la répartition des ventes mensuelles par agent (tous agents confondus).
 * ➤ Montrer un classement des agents selon leur performance.
 */

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
        const res = await axiosInstance.get("/sales/monthly-agents-charthorizontal");
        const result = res.data;

        const agentTotals = Object.entries(result).map(([agent, weeks]) => {
          const total = Object.values(weeks).reduce((sum, daysObj) => {
            return sum + Object.values(daysObj).reduce((a, b) => a + b, 0);
          }, 0);
          return { name: agent, value: total };
        });

        const filtered = agentTotals.filter((a) => a.value > 0);
        const totalAll = filtered.reduce((a, b) => a + b.value, 0);
        const withPercent = filtered.map((a) => ({
          ...a,
          percent: ((a.value / totalAll) * 100).toFixed(1),
        }));
        withPercent.sort((a, b) => b.value - a.value);

        setData(withPercent);
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
      {/* Conteneur principal en flex */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-10 w-full max-w-6xl">

        {/* Diagramme circulaire */}
        <div className="w-full md:w-1/2 h-96 flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={130}
                label={({ name, percent }) => `${name} (${percent}%)`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => {
                  const pct = props.payload.percent;
                  return [`${pct}% du total (${value} ventes)`, name];
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Classement à droite */}
        <div className="w-full md:w-1/2 flex flex-col items-start justify-center">
          <h3 className="font-semibold text-lg mb-3">🏅 Classement des agents</h3>
          <ol className="list-decimal ml-5 space-y-2 text-sm">
            {data.map((agent, idx) => (
              <li key={idx} className="flex items-center gap-2">
                {idx < 3 ? (
                  <span className="text-xl">{PODIUM_ICONS[idx]}</span>
                ) : (
                  <span className="w-5" />
                )}
                <span>
                  <strong>{agent.name}</strong> — {agent.value} ventes ({agent.percent}%)
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

























// ----------------------------------- Version Finale  --------------------------------------
// import React, { useEffect, useState } from "react";
// import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
// import axiosInstance from "../../api/axiosInstance";

// // Palette dégradée/professionnelle blue/green/violet soft
// const COLORS = [
//   "#60A5FA", // bleu pastel
//   "#38BDF8", // bleu clair
//   "#34D399", // vert pastel
//   "#C084FC", // violet pastel
//   "#F472B6", // rose pastel
//   "#FDA4AF"  // rose clair
//   // "#A78BFA", // violet clair
//   // "#FBBF24", // jaune pastel
//   // "#F87171"  // rouge pastel
//   // orange pastel "#FB923C"
//   // noir pastel "#94A3B8"

// ];
// const PODIUM_ICONS = ["🏆", "🥈", "🥉"];

// export default function MonthlyAgentSalesPieChart() {
//   const [data, setData] = useState([]);
//   const currentMonth = new Date().toLocaleString("fr-FR", { month: "long" });

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await axiosInstance.get("/sales/monthly-agents-charthorizontal");
//         const result = res.data;

//         const agentTotals = Object.entries(result).map(([agent, weeks]) => {
//           const total = Object.values(weeks).reduce((sum, daysObj) => {
//             return sum + Object.values(daysObj).reduce((a, b) => a + b, 0);
//           }, 0);
//           return { name: agent, value: total };
//         });

//         const filtered = agentTotals.filter((a) => a.value > 0);
//         const totalAll = filtered.reduce((a, b) => a + b.value, 0);
//         const withPercent = filtered.map((a) => ({
//           ...a,
//           percent: ((a.value / totalAll) * 100).toFixed(1),
//         }));
//         withPercent.sort((a, b) => b.value - a.value);

//         setData(withPercent);
//       } catch (err) {
//         console.error("Erreur chargement ventes:", err);
//       }
//     };

//     fetchData();
//   }, []);

//   return (
//     <div className="bg-white shadow rounded-2xl p-8 flex flex-col items-center w-full">
//       <h2 className="text-xl font-semibold mb-6 text-center text-gray-700">
//         Classement Top Vendeurs : <span className="capitalize">{currentMonth}</span>
//       </h2>

//       <div className="flex flex-col md:flex-row justify-center items-center gap-12 w-full max-w-5xl">
//         {/* Diagramme circulaire */}
//         <div className="w-full md:w-1/2 flex justify-center items-center">
//             <ResponsiveContainer width={300} height={300}>
//               <PieChart>
//                 <Pie
//   data={data}
//   dataKey="value"
//   nameKey="name"
//   cx="50%"
//   cy="50%"
//   outerRadius={130}
//   label={({ name, percent }) => `${name} (${percent}%)`}
//   labelLine={false}
//   paddingAngle={0}   // <-- Pas d’espace entre part
// >
//   {data.map((entry, index) => (
//     <Cell
//       key={`cell-${index}`}
//       fill={COLORS[index % COLORS.length]}
//       stroke="#fff"  // bord blanc fin entre parts
//       strokeWidth={1}
//     />
//   ))}
// </Pie>

//                 <Tooltip
//                   wrapperStyle={{
//                     borderRadius: 8,
//                     boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
//                   }}
//                   contentStyle={{ fontSize: 14, background: "#F9FAFB" }}
//                   formatter={(value, name, props) =>
//                     [`${props.payload.percent}% du total (${value} ventes)`, name]
//                   }
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>

//         {/* Classement à droite */}
//         <div className="w-full md:w-1/2 flex flex-col items-start justify-center">
//           <h3 className="font-semibold text-lg mb-3 text-gray-600">🏅 Classement des agents</h3>
//           <ol className="space-y-3 text-base">
//             {data.map((agent, idx) => (
//               <li
//                 key={idx}
//                 className="flex items-center gap-3"
//               >
//                 <span
//                   className="inline-block w-7 h-7 rounded-full"
//                   style={{ background: COLORS[idx % COLORS.length] }}
//                 ></span>
//                 {idx < 3 ? (
//                   <span className="text-xl">{PODIUM_ICONS[idx]}</span>
//                 ) : (
//                   <span className="w-5" />
//                 )}
//                 <span>
//                   <span className="font-semibold text-gray-700">{agent.name}</span>
//                   <span className="ml-1 text-gray-400 italic">({agent.value} ventes, {agent.percent}%)</span>
//                 </span>
//               </li>
//             ))}
//           </ol>
//         </div>
//       </div>
//     </div>
//   );
// }
