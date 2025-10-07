/**
 * src/cards/WeeklySalesChart
 * ------------------------------------------------------------
 * ➤  Afficher un graphique en barres des ventes hebdomadaires pour l'agent
 * ➤  Afficher un graphique en barres de tous les ventes hebdomadaires pour l'admin
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

const WeeklySalesChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role");
  const isAdminOrManager = role === "Admin" || role === "Manager";

  // pour l'affichage de l'admin
  const translateDaysEnToFr = {
    Mon: 'Lundi',
    Tue: 'Mardi',
    Wed: 'Mercredi',
    Thu: 'Jeudi',
    Fri: 'Vendredi',
  };

  useEffect(() => {
    async function fetchWeeklySales() {
      try {
        // 🔹 Choisir la bonne route selon le rôle
        const endpoint = isAdminOrManager
          ? '/sales/weekly-agents'
          : '/sales/weekly';

        const { data: result } = await axiosInstance.get(endpoint);

        let formattedData = [];

        if (isAdminOrManager) {
          // Pour l'admin, result = [{ day, ventes }, ...]
          formattedData = result;
        } else {

          // Pour l'affichage de l'agent (Lundi → Vendredi)
          const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
          const dayIndexToGetDay = [1, 2, 3, 4, 5]; // 1 = Lundi, ..., 5 = Vendredi

          // base vide
          const emptyWeekData = daysOfWeek.map((day) => ({ day, ventes: 0 }));

          // remplir avec les vraies données
          formattedData = emptyWeekData.map((dayEntry, index) => {
            const targetDay = dayIndexToGetDay[index];
            const found = result.find(r => {
              const date = new Date(r.date);
              return date.getDay() === targetDay;
            });
            return found
              ? { day: dayEntry.day, ventes: parseInt(found.validated_sales, 10) }
              : dayEntry;
          });
        }

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
  }, [isAdminOrManager]);

  if (loading) return <p>Chargement des ventes de la semaine...</p>;
  if (!data.length) return <p>Aucune donnée disponible.</p>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow w-full h-[400px]">
      <h2 className="text-lg font-semibold mb-4">Ventes quotidiennes globales</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tickFormatter={(day) => translateDaysEnToFr[day] || day} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            content={<CustomTooltip />}
            labelFormatter={(day) => translateDaysEnToFr[day] || day}
          />
          <Bar
            dataKey="ventes"
            fill="#3B82F6 "
            radius={[6, 6, 0, 0]}
            barSize={40}
            animationDuration={500}

          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklySalesChart;





















// ----------------------- Version Finale avec couleurs par jour -----------------------

// import React, { useEffect, useState } from 'react';
// import axiosInstance from '../../api/axiosInstance';

// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Cell,
// } from 'recharts';

// const CustomTooltip = ({ active, payload, label }) => {
//   if (active && payload && payload.length) {
//     return (
//       <div className="bg-white p-2 rounded shadow text-sm">
//         <p className="font-medium">{label}</p>
//         <p>{`Ventes : ${payload[0].value}`}</p>
//       </div>
//     );
//   }
//   return null;
// };

// const translateDaysEnToFr = {
//   Mon: 'Lun',
//   Tue: 'Mar',
//   Wed: 'Mer',
//   Thu: 'Jeu',
//   Fri: 'Ven',
// };

// const colorsByDay = {
//   Lun: '#6366F1',
//   Mar: '#F59E0B',
//   Mer: '#10B981',
//   Jeu: '#EF4444',
//   Ven: '#8B5CF6',
// };

// const WeeklySalesChart = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const role = localStorage.getItem("role");
//   const isAdminOrManager = role === "Admin" || role === "Manager";

//   useEffect(() => {
//     async function fetchWeeklySales() {
//       try {
//         const endpoint = isAdminOrManager ? '/sales/weekly-agents' : '/sales/weekly';

//         const { data: result } = await axiosInstance.get(endpoint);

//         let formattedData = [];

//         if (isAdminOrManager) {
//           formattedData = result;
//         } else {
//           const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
//           const dayIndexToGetDay = [1, 2, 3, 4, 5];

//           const emptyWeekData = daysOfWeek.map(day => ({ day, ventes: 0 }));

//           formattedData = emptyWeekData.map((dayEntry, index) => {
//             const targetDay = dayIndexToGetDay[index];
//             const found = result.find(r => {
//               const date = new Date(r.date);
//               return date.getDay() === targetDay;
//             });
//             return found
//               ? { day: dayEntry.day, ventes: parseInt(found.validated_sales, 10) }
//               : dayEntry;
//           });
//         }

//         setData(formattedData);
//       } catch (err) {
//         console.error("❌ Erreur chargement ventes de la semaine :", err.response?.data || err.message);
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchWeeklySales();
//   }, [isAdminOrManager]);

//   if (loading) return <p>Chargement des ventes de la semaine...</p>;
//   if (!data.length) return <p>Aucune donnée disponible.</p>;

//   return (
//     <div className="bg-white p-6 rounded-2xl shadow w-full h-[400px]">
//       <h2 className="text-lg font-semibold mb-4">Ventes hebdomadaires globales</h2>
//       <ResponsiveContainer width="100%" height="100%">
//         <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
//           <CartesianGrid strokeDasharray="3 3" vertical={false} />
//           <XAxis dataKey="day" />
//           <YAxis tickLine={false} axisLine={false} />
//           <Tooltip content={<CustomTooltip />} />
//           <Bar
//             dataKey="ventes"
//             radius={[6, 6, 0, 0]}
//             barSize={40}
//             animationDuration={500}
//           >
//             {data.map((entry, index) => {
//               const frenchDay = translateDaysEnToFr[entry.day] || entry.day;
//               return (
//                 <Cell key={`cell-${index}`} fill={colorsByDay[frenchDay] || '#000'} />
//               );
//             })}
//           </Bar>
//         </BarChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default WeeklySalesChart;
