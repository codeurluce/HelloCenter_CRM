import React from 'react';
import {
  Play,
  CalendarPlus,
  Check,
  Phone,
  Mail,
  MapPin,
  Hash,
  User,
  Clock,
  Eye,
  Lightbulb,
  Flame,
} from 'lucide-react';
import { Fiche } from './types/fiche.ts';

interface FicheCardProps {
  fiche: Fiche;
  currentAgent: string;
  onTreatFiche: (id: number) => void;
  onOpenClotureModal: (id: number) => void;
  onProgramRdv: (id: number) => void;
  onCancelFiche: (id: number) => void;
  onVoirRdvDetails?: (fiche: Fiche) => void; // Optionnel pour voir les détails du rendez-vous
}

const FicheCard: React.FC<FicheCardProps> = ({
  fiche,
  currentAgent,
  onTreatFiche,
  onOpenClotureModal,
  onProgramRdv,
  onCancelFiche,
  onVoirRdvDetails = () => { }, // Fonction par défaut vide si non fourni
}) => {

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'nouvelle':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_traitement':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rendez_vous':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cloturee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'nouvelle':
        return 'Nouvelle';
      case 'en_traitement':
        return 'En traitement';
      case 'rendez_vous':
        return 'Rendez vous';
      case 'cloturee':
        return 'Clôturée';
      default:
        return statut;
    }
  };

  // const getInitials = (name: string) => {
  //   const parts = name.trim().split(' ');
  //   if (parts.length === 1) return parts[0][0].toUpperCase();
  //   return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
  // };
  // console.log('🧪 fiche.id:', fiche.id, ', statut:', fiche.statut, ', assigned_to:', fiche.assigned_to, ', currentAgent:', currentAgent);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      {/* En-tête */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {fiche.nom_client} {fiche.prenom_client}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Hash size={14} />
            <span>ID: {fiche.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
              fiche.statut
            )}`}
          >
            {getStatusLabel(fiche.statut)}
          </span>

          {/* Badge initiales si en traitement */}
          {/* {fiche.statut === 'en_traitement' && fiche.assignedToName && (
            <div
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow"
              title={fiche.assignedToName}
              translate="no"
            >
              {getInitials(fiche.assignedToName)}
            </div>
          )} */}
        </div>
      </div>

      {/* Infos client */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-1 gap-3">
          {fiche.adresse_client && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400" />
              <span>{fiche.adresse_client}</span>
              {fiche.code_postal && <span>({fiche.code_postal})</span>}
            </div>
          )}

          {fiche.numero_mobile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={16} className="text-gray-400" />
              <span>{fiche.numero_mobile}</span>
            </div>
          )}

          {fiche.mail_client && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={16} className="text-gray-400" />
              <span className="truncate">{fiche.mail_client}</span>
            </div>
          )}

          {fiche.pce && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lightbulb size={16} className="text-gray-400" />
              <span>(pce) {fiche.pce}</span>
            </div>
          )} 
          
          {fiche.pdl && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Flame size={16} className="text-gray-400" />
              <span>(pdl) {fiche.pdl}</span>
            </div>
          )} 
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="font-medium">Univers:</span>
            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
              {fiche.univers}
            </span>
          </div>

          {fiche.assignedToName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} className="text-gray-400" />
              <span>
                Assignée à:{' '}
                <span className="font-medium" translate="no">
                  {fiche.assignedToName}
                </span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <Clock size={12} className="text-gray-400" />
            <span>
              Créée le{' '}
              {new Date(fiche.date_creation).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        {fiche.tag && (
          <div className="pt-2">
            <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
              {fiche.tag}
            </span>
          </div>
        )}

        {fiche.commentaire && (
          <div className="pt-2">
            <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3 italic">
              "{fiche.commentaire}"
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {/* Prendre en charge */}
        {fiche.statut === 'nouvelle' && (
          <button
            onClick={() => { console.log('🛠️ Traitement demandé pour fiche ID:', fiche.id); onTreatFiche(fiche.id) }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Play size={16} />
            Prendre en charge
          </button>
        )}

        {/* Voir les détails du rendez-vous */}
        {fiche.statut === 'rendez_vous' && (

          <>
            <button
              onClick={() => { console.log('🛠️ Traitement demandé pour fiche ID:', fiche.id); onTreatFiche(fiche.id) }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <Play size={16} />
              Poursuivre
            </button>
            <button
              className="flex items-center gap-2 px-4 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              onClick={() => onVoirRdvDetails?.(fiche)} // ✅ Sécurisé avec "?."
            >
              <Eye size={16} />
            </button>
          </>
        )}

        {/* Actions fiche en traitement par agent courant */}
        {fiche.statut === 'en_traitement' &&
          Number(fiche.assigned_to) === Number(currentAgent) && (
            <>
              <button
                onClick={() => onOpenClotureModal(fiche.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
              >
                <Check size={16} />
                Clôturer
              </button>
              <button
                onClick={() => onProgramRdv(fiche.id)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium shadow-sm"
              >
                <CalendarPlus size={16} />
                Rendez-vous
              </button>
              {/* <button
                onClick={() => {
                  console.log("🧪 Bouton Annuler cliqué pour la fiche ID :", fiche.id)
                  onCancelFiche(fiche.id);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
              >
                Annuler
              </button> */}
            </>
          )}
      </div>
    </div>
  );
};

export default FicheCard;
















// -------------------------- Version Finale -------------------------
// import React from "react";
// import {
//   Play,
//   CalendarPlus,
//   Check,
//   Phone,
//   Mail,
//   MapPin,
//   Hash,
//   User,
//   Clock,
//   Eye,
//   Lightbulb,
//   Flame,
// } from "lucide-react";
// import { Fiche } from "./types/fiche.ts";

// interface FicheCardProps {
//   fiche: Fiche;
//   currentAgent: string;
//   onTreatFiche: (id: number) => void;
//   onOpenClotureModal: (id: number) => void;
//   onProgramRdv: (id: number) => void;
//   onCancelFiche: (id: number) => void;
//   onVoirRdvDetails?: (fiche: Fiche) => void;
// }

// const FicheCard: React.FC<FicheCardProps> = ({
//   fiche,
//   currentAgent,
//   onTreatFiche,
//   onOpenClotureModal,
//   onProgramRdv,
//   onCancelFiche,
//   onVoirRdvDetails = () => {},
// }) => {
//   const getStatusStyle = (statut: string) => {
//     switch (statut) {
//       case "nouvelle":
//         return "from-blue-500/10 to-blue-100 border-blue-200 text-blue-700";
//       case "en_traitement":
//         return "from-yellow-500/10 to-yellow-100 border-yellow-200 text-yellow-700";
//       case "rendez_vous":
//         return "from-orange-500/10 to-orange-100 border-orange-200 text-orange-700";
//       case "cloturee":
//         return "from-green-500/10 to-green-100 border-green-200 text-green-700";
//       default:
//         return "from-gray-100 to-gray-50 border-gray-200 text-gray-700";
//     }
//   };

//   const getStatusLabel = (statut: string) => {
//     switch (statut) {
//       case "nouvelle":
//         return "Nouvelle";
//       case "en_traitement":
//         return "En traitement";
//       case "rendez_vous":
//         return "Rendez-vous";
//       case "cloturee":
//         return "Clôturée";
//       default:
//         return statut;
//     }
//   };

//   return (
//     <div className="relative rounded-2xl border border-gray-100 bg-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
//       {/* Header avec dégradé */}
//       <div
//         className={`p-5 bg-gradient-to-r ${getStatusStyle(
//           fiche.statut
//         )} border-b flex justify-between items-start`}
//       >
//         <div>
//           <h3 className="text-lg font-semibold text-gray-900 leading-tight">
//             {fiche.nom_client} {fiche.prenom_client}
//           </h3>
//           <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
//             <Hash size={14} />
//             <span>ID {fiche.id}</span>
//           </div>
//         </div>
//         <span
//           className="px-3 py-1 text-xs font-medium bg-white/70 text-gray-800 rounded-full shadow-sm border border-white"
//         >
//           {getStatusLabel(fiche.statut)}
//         </span>
//       </div>

//       {/* Body */}
//       <div className="p-5 space-y-3">
//         <div className="space-y-2 text-sm text-gray-700">
//           {fiche.adresse_client && (
//             <div className="flex items-center gap-2">
//               <MapPin size={16} className="text-red-500" />
//               <span>{fiche.adresse_client}</span>
//               {fiche.code_postal && <span>(CP : {fiche.code_postal})</span>}
//             </div>
//           )}

//           {fiche.numero_mobile && (
//             <div className="flex items-center gap-2">
//               <Phone size={16} className="text-blue-500" />
//               <span>{fiche.numero_mobile}</span>
//             </div>
//           )}

//           {fiche.mail_client && (
//             <div className="flex items-center gap-2">
//               <Mail size={16} className="text-green-500" />
//               <span className="truncate">{fiche.mail_client}</span>
//             </div>
//           )}

//           {fiche.pce && (
//             <div className="flex items-center gap-2">
//               <Lightbulb size={16} className="text-yellow-500" />
//               <span>PCE: {fiche.pce}</span>
//             </div>
//           )}

//           {fiche.pdl && (
//             <div className="flex items-center gap-2">
//               <Flame size={16} className="text-red-500" />
//               <span>PDL: {fiche.pdl}</span>
//             </div>
//           )}
//         </div>

//         {/* Univers & Agent */}
//         <div className="border-t pt-3 text-sm text-gray-700 space-y-1">
//           <div className="flex items-center gap-2">
//             <span className="font-medium">Univers :</span>
//             <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
//               {fiche.univers}
//             </span>
//           </div>

//           {fiche.assignedToName && (
//             <div className="flex items-center gap-2">
//               <User size={16} className="text-gray-400" />
//               <span>
//                 Assignée à{" "}
//                 <span className="font-semibold" translate="no">
//                   {fiche.assignedToName}
//                 </span>
//               </span>
//             </div>
//           )}

//           <div className="flex items-center gap-2 text-xs text-gray-500">
//             <Clock size={12} />
//             <span>
//               Créée le {new Date(fiche.date_creation).toLocaleDateString("fr-FR")}
//             </span>
//           </div>
//         </div>

//         {/* Commentaire */}
//         {fiche.commentaire && (
//           <div className="bg-gray-50 rounded-lg p-3 text-sm italic text-gray-600 border border-gray-100">
//             “{fiche.commentaire}”
//           </div>
//         )}
//       </div>

//       {/* Actions */}
//       <div className="px-5 py-4 border-t bg-gray-50 flex flex-wrap gap-2 justify-end">
//         {fiche.statut === "nouvelle" && (
//           <button
//             onClick={() => onTreatFiche(fiche.id)}
//             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
//           >
//             <Play size={16} />
//             Prendre en charge
//           </button>
//         )}

//         {fiche.statut === "rendez_vous" && (
//           <>
//             <button
//               onClick={() => onTreatFiche(fiche.id)}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
//             >
//               <Play size={16} />
//               Poursuivre
//             </button>
//             <button
//               onClick={() => onVoirRdvDetails(fiche)}
//               className="flex items-center gap-2 px-3 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
//             >
//               <Eye size={16} />
//               Détails
//             </button>
//           </>
//         )}

//         {fiche.statut === "en_traitement" &&
//           Number(fiche.assigned_to) === Number(currentAgent) && (
//             <>
//               <button
//                 onClick={() => onOpenClotureModal(fiche.id)}
//                 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
//               >
//                 <Check size={16} />
//                 Clôturer
//               </button>
//               <button
//                 onClick={() => onProgramRdv(fiche.id)}
//                 className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium shadow-sm"
//               >
//                 <CalendarPlus size={16} />
//                 Rendez-vous
//               </button>
//             </>
//           )}
//       </div>
//     </div>
//   );
// };

// export default FicheCard;
