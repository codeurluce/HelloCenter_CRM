import React, { useEffect, useState } from "react";
import { 
  X,
  Clock, 
  ClipboardPlus,
  ClipboardX,
  ClipboardPen,
  Headphones
} from "lucide-react";
import dayjs from "dayjs";
import axiosInstance from "../../api/axiosInstance";

interface HistoriqueVentesModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number | null;
}

export default function HistoriqueVentesModal({ isOpen, onClose, saleId }: HistoriqueVentesModalProps) {
  const [historique, setHistorique] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && saleId) {
      fetchHistorique();
    }
  }, [isOpen, saleId]);

  const fetchHistorique = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/historiques/ventes/${saleId}`);
      setHistorique(res.data);
    } catch (err: any) {
      console.error("Erreur chargement historique", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

if (!isOpen) return null;

  const renderIcon = (action: string) => {
    switch (action) {
  case "CREATION":
    return <ClipboardPlus className="text-blue-500" size={18} />;
  case "MODIFICATION":
  case "MODIFICATION_STATUT":
    return <ClipboardPen className="text-purple-500" size={18} />;
  case "SUPPRESSION":
    return <ClipboardX className="text-red-500" size={18} />;
  case "AUDIT":
    return <Headphones className="text-green-500" size={18} />;
  default:
    return <Clock className="text-gray-400" size={18} />;
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Historique de la fiche N° {saleId}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <p className="text-center text-gray-500">Chargement...</p>
        ) : historique.length === 0 ? (
          <p className="text-center text-gray-400">Aucun historique trouvé</p>
        ) : (
          <ul className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            {historique.map((h) => (
              <li key={h} className="flex items-start gap-3">
                {/* Icône */}
                <div className="mt-1">{renderIcon(h.action)}</div>

                {/* Texte */}
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{h.actor_name}</span> [ {h.action} ] {h.commentaire}
                  </p>
                  <p className="text-xs text-gray-400">
                    {dayjs(h.created_at).format("DD/MM/YYYY HH:mm:ss")}
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
//   Clock, 
//   ClipboardPlus,
//   ClipboardX,
//   ClipboardPen,
//   Headphones
// } from "lucide-react";
// import dayjs from "dayjs";
// import axiosInstance from "../../api/axiosInstance";

// interface HistoriqueVentesModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   saleId: number | null;
// }

// export default function HistoriqueVentesModal({
//   isOpen,
//   onClose,
//   saleId,
// }: HistoriqueVentesModalProps) {
//   const [historique, setHistorique] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (isOpen && saleId) {
//       fetchHistorique();
//     }
//   }, [isOpen, saleId]);

//   const fetchHistorique = async () => {
//     setLoading(true);
//     try {
//       const res = await axiosInstance.get(`/historiques/ventes/${saleId}`);
//       setHistorique(res.data);
//     } catch (err) {
//       console.error("Erreur chargement historique", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;
//   const renderIcon = (action: string) => {
//     switch (action) {
//   case "CREATION":
//     return <ClipboardPlus className="text-blue-500" size={18} />;
//   case "MODIFICATION":
//   case "MODIFICATION_STATUT":
//     return <ClipboardPen className="text-purple-500" size={18} />;
//   case "SUPPRESSION":
//     return <ClipboardX className="text-red-500" size={18} />;
//   case "AUDIT":
//     return <Headphones className="text-green-500" size={18} />;
//   default:
//     return <Clock className="text-gray-400" size={18} />;
//     }
//   };
//   return (
//     <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
//         {/* Header avec dégradé */}
//         <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-5 text-white flex justify-between items-center">
//           <h2 className="text-lg font-semibold">
//             Historique de la fiche N° {saleId}
//           </h2>
//           <button
//             onClick={onClose}
//             className="text-white/80 hover:text-white"
//           >
//             <X size={22} />
//           </button>
//         </div>

//         {/* Body */}
//         <div className="p-6 max-h-[70vh] overflow-y-auto">
//           {loading ? (
//             <p className="text-center text-gray-500">Chargement...</p>
//           ) : historique.length === 0 ? (
//             <p className="text-center text-gray-400">
//               Aucun historique trouvé
//             </p>
//           ) : (
//             <ul className="space-y-6 relative">
//               {historique.map((h) => (
//                 <li key={h} className="flex items-start gap-3 relative">
//                   {/* Timeline line */}
//                   {h !== historique.length - 1 && (
//                     <span className="absolute left-2.5 top-6 h-full w-px bg-gray-200"></span>
//                   )}

//                   {/* Icône dans une bulle */}
//                   <div className="flex-shrink-0">
//                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
//                       {renderIcon(h.action)}
//                     </div>
//                   </div>

//                   {/* Texte */}
//                   <div className="flex-1">
//                     <p className="text-sm text-gray-700">
//                       <span className="font-semibold">{h.actor_name}</span>{" "} -
//                       [ {h.action} ] -  {h.commentaire}
//                     </p>
//                     <p className="text-xs text-gray-400">
//                       {dayjs(h.created_at).format(
//                         "DD/MM/YYYY HH:mm:ss"
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
