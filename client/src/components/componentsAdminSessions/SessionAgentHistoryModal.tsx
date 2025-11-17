import React, { useEffect, useState } from "react";
import {
    X,
    Clock,
    LogIn,
    LogOut,
    Pause,
    User,
} from "lucide-react";
import dayjs from "dayjs";
import axiosInstance from "../../api/axiosInstance";

interface SessionAgentHistoryModalProps {
    agent: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function SessionAgentHistoryModal({
    agent,
    isOpen,
    onClose,
}: SessionAgentHistoryModalProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [fromDate, setFromDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [filterType, setFilterType] = useState("");

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params: any = { from: fromDate, to: toDate };
            if (filterType) params.type = filterType;

            const res = await axiosInstance.get(
                `/session_agents/user/${agent.user_id}/all-history`,
                { params }
            );

            setHistory(res.data);
        } catch (err: any) {
            console.error(
                "Erreur chargement historique agent",
                err.response?.data || err.message
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && agent) fetchHistory();
    }, [isOpen, agent, fromDate, toDate, filterType]);

    if (!isOpen) return null;

    const renderIcon = (type: string) => {
        switch (type) {
            case "connexion":
                return <LogIn className="text-green-500" size={18} />;
            case "deconnexion":
            case "deconnexion_forcee":
            case "deconnexion_systeme":
                return <LogOut className="text-red-500" size={18} />;
            case "status_change":
                return <Pause className="text-blue-500" size={18} />;
            default:
                return <Clock className="text-gray-400" size={18} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl p-6">

                {/* HEADER */}
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">
                        Historique de session – {agent.firstname} {agent.lastname}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500">
                        <X size={20} />
                    </button>
                </div>

                {/* FILTRES */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <div>
                        <label className="text-sm text-gray-600 mr-2">De</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 mr-2">À</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 mr-2">Type</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            <option value="">Tous</option>
                            <option value="connexion">Connexion</option>
                            <option value="deconnexion">Déconnexion</option>
                            <option value="status_change">Changement de statut</option>
                        </select>
                    </div>
                </div>

                {/* BODY */}
                {loading ? (
                    <p className="text-center text-gray-500">Chargement...</p>
                ) : history.length === 0 ? (
                    <p className="text-center text-gray-400">Aucun historique trouvé</p>
                ) : (
                    <ul className="space-y-4 max-h-[400px] overflow-y-auto">
                        {history.map((h, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                {/* Icône */}
                                <div className="mt-1">{renderIcon(h.type)}</div>

                                {/* Texte */}
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">
                                            {h.narrative}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {dayjs(h.timestamp).format("DD/MM/YYYY HH:mm:ss")}
                                        {h.admin_name ? ` — Admin : ${h.admin_name}` : ""}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}













































// ----------------------------------------- Version Finale -----------------------------------------
// import React, { useEffect, useState } from "react";
// import {
//   X,
//   LogIn,
//   LogOut,
//   Pause,
//   Clock,
// } from "lucide-react";
// import dayjs from "dayjs";
// import axiosInstance from "../../api/axiosInstance";

// interface SessionAgentHistoryModalProps {
//   agent: any;
//   isOpen: boolean;
//   onClose: () => void;
// }

// export default function SessionAgentHistoryModal({
//   agent,
//   isOpen,
//   onClose,
// }: SessionAgentHistoryModalProps) {
//   const [history, setHistory] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [fromDate, setFromDate] = useState(dayjs().format("YYYY-MM-DD"));
//   const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
//   const [filterType, setFilterType] = useState("");

//   const fetchHistory = async () => {
//     setLoading(true);
//     try {
//       const params: any = { from: fromDate, to: toDate };
//       if (filterType) params.type = filterType;

//       const res = await axiosInstance.get(
//         `/session_agents/user/${agent.user_id}/all-history`,
//         { params }
//       );

//       setHistory(res.data);
//     } catch (err: any) {
//       console.error("Erreur chargement historique agent", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (isOpen && agent) fetchHistory();
//   }, [isOpen, agent, fromDate, toDate, filterType]);

//   if (!isOpen) return null;

//   const renderIcon = (type: string) => {
//     switch (type) {
//       case "connexion":
//         return <LogIn className="text-green-500" size={18} />;

//       case "deconnexion":
//       case "deconnexion_forcee":
//       case "deconnexion_systeme":
//         return <LogOut className="text-red-500" size={18} />;

//       case "status_change":
//         return <Pause className="text-blue-500" size={18} />;

//       default:
//         return <Clock className="text-gray-400" size={18} />;
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">

//         {/* Header avec dégradé */}
//         <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-5 text-white flex justify-between items-center">
//           <h2 className="text-lg font-semibold">
//             Historique – {agent.firstname} {agent.lastname}
//           </h2>
//           <button onClick={onClose} className="text-white/80 hover:text-white">
//             <X size={22} />
//           </button>
//         </div>

//         {/* Filtres */}
//         <div className="p-4 border-b bg-gray-50">
//           <div className="flex flex-wrap gap-4">

//             <div>
//               <label className="text-sm text-gray-600 mr-2">De</label>
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 className="border rounded-lg px-3 py-1.5 text-sm shadow-sm"
//               />
//             </div>

//             <div>
//               <label className="text-sm text-gray-600 mr-2">À</label>
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 className="border rounded-lg px-3 py-1.5 text-sm shadow-sm"
//               />
//             </div>

//             <div>
//               <label className="text-sm text-gray-600 mr-2">Type</label>
//               <select
//                 value={filterType}
//                 onChange={(e) => setFilterType(e.target.value)}
//                 className="border rounded-lg px-3 py-1.5 text-sm shadow-sm"
//               >
//                 <option value="">Tous</option>
//                 <option value="connexion">Connexion</option>
//                 <option value="deconnexion">Déconnexion</option>
//                 <option value="status_change">Changement de statut</option>
//               </select>
//             </div>

//           </div>
//         </div>

//         {/* Body */}
//         <div className="p-6 max-h-[65vh] overflow-y-auto">
//           {loading ? (
//             <p className="text-center text-gray-500">Chargement...</p>
//           ) : history.length === 0 ? (
//             <p className="text-center text-gray-400">Aucun historique trouvé</p>
//           ) : (
//             <ul className="space-y-6 relative">

//               {history.map((h, idx) => (
//                 <li key={idx} className="flex items-start gap-3 relative">

//                   {/* Timeline line */}
//                   {idx !== history.length - 1 && (
//                     <span className="absolute left-2.5 top-6 h-full w-px bg-gray-200"></span>
//                   )}

//                   {/* Icône dans une bulle */}
//                   <div className="flex-shrink-0">
//                     <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
//                       {renderIcon(h.type)}
//                     </div>
//                   </div>

//                   {/* Texte */}
//                   <div className="flex-1">
//                     <p className="text-sm text-gray-700">
//                       {h.narrative}
//                     </p>

//                     <p className="text-xs text-gray-400">
//                       {dayjs(h.timestamp).format("DD/MM/YYYY HH:mm:ss")}
//                       {h.admin_name && (
//                         <span className="ml-1 text-purple-500 font-semibold">
//                           — Admin : {h.admin_name}
//                         </span>
//                       )}
//                     </p>
//                   </div>

//                 </li>
//               ))}

//             </ul>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
