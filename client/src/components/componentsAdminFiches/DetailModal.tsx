// ----------------------------------------- Version Initiale -----------------------------------------
import React from "react";
import { X } from "lucide-react";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiche: any | null; // tu peux remplacer `any` par ton interface Fiche
}

export default function DetailModal({ isOpen, onClose, fiche }: DetailModalProps) {
  if (!isOpen || !fiche) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Détails de la fiche N° {fiche.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <div>

            <p><span className="font-semibold">Nom :</span> {fiche.nom_client}</p>
            <p><span className="font-semibold">Prénom :</span> {fiche.prenom_client}</p>
            <p><span className="font-semibold">Email :</span> {fiche.mail_client}</p>
            <p><span className="font-semibold">Téléphone Mobile :</span> {fiche.numero_mobile}</p>
            <p><span className="font-semibold">Téléphone fixe :</span> {fiche.numero_fixe || 'Non renseignée'}</p>
            <p><span className="font-semibold">Pdl :</span> {fiche.pdl || 'Non renseignée'}</p>
          </div>
          <div>
            <p><span className="font-semibold">Univers :</span> {fiche.univers}</p>
            <p><span className="font-semibold">Statut :</span> {fiche.statut}</p>
            <p><span className="font-semibold">Ville :</span> {fiche.ville_client || 'Non renseignée'}</p>
            <p><span className="font-semibold">Adresse :</span> {fiche.adresse_client}</p>
            <p><span className="font-semibold">Code postal :</span> {fiche.code_postal}</p>
            <p><span className="font-semibold">Pce :</span> {fiche.pce || 'Non renseignée'}</p>
          </div>
        </div>

        {/* Commentaire */}
        {(fiche.statut === 'cloturee' && fiche.commentaire) && (
          <section>
            <h3 className="text-lg font-semibold mb-2">Commentaire clôture</h3>
            <p className="italic bg-gray-50 p-3 rounded">{fiche.commentaire}</p>
          </section>
        )}
        {(fiche.statut === 'rendez_vous' && fiche.rendez_vous_commentaire) && (
          <section>
            <h3 className="text-lg font-semibold mb-2">Commentaire RDV</h3>
            <p className="italic bg-gray-50 p-3 rounded">{fiche.rendez_vous_commentaire}</p>
          </section>
        )}
        {/* Dates */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-gray-500">
          <p>Créée le : {fiche.date_creation ? new Date(fiche.date_creation).toLocaleString() : "—"}</p>
        </div>
      </div>
    </div>
  );
}

























// ----------------------------------- Version Pré-intermediaire ---------------------------------
// import React from 'react';
// import { X, Phone, Mail, MapPin, Hash, User, Clock, Smartphone, Mailbox, Redo, Building2, File, BookmarkCheck } from 'lucide-react';

// interface DetailModalProps {
//   fiche: any; // Remplacez par votre type exact
//   isOpen: boolean;
//   onClose: () => void;
// }

// const DetailModal: React.FC<DetailModalProps> = ({ fiche, isOpen, onClose }) => {
//   if (!isOpen || !fiche) return null;

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
//       <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative p-6">
//         {/* Bouton fermer */}
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition"
//           aria-label="Fermer la fenêtre"
//         >
//           <X size={20} />
//         </button>

//         {/* Titre */}
//         <h2 className="text-2xl font-bold mb-6 text-gray-900">
//           Détails de la fiche N° {fiche.id}
//         </h2>

//         {/* Contenu */}
//         <div className="space-y-4 text-gray-700 text-sm">

//           <div className="flex items-center gap-2">
//             <BookmarkCheck size={18} className="text-gray-400" />
//             <span className="font-medium">Univers:</span>
//             <span>{fiche.univers}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <File size={18} className="text-gray-400" />
//             <span className="font-medium">Statut:</span>
//             <span>{fiche.statut}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <User size={18} className="text-gray-400" />
//             <span className="font-medium">Client:</span>
//             <span>{fiche.nom_client} {fiche.prenom_client}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <Smartphone size={18} className="text-gray-400" />
//             <span className="font-medium">Mobile:</span>
//             <span>{fiche.numero_mobile || 'Non renseigné'}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <Phone size={18} className="text-gray-400" />
//             <span className="font-medium">Fixe:</span>
//             <span>{fiche.numero_fixe || 'Non renseigné'}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <Mail size={18} className="text-gray-400" />
//             <span className="font-medium">Email:</span>
//             <span>{fiche.mail_client || 'Non renseigné'}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <Building2 size={18} className="text-gray-400" />
//             <span className="font-medium">Ville:</span>
//             <span>{fiche.ville_client || 'Non renseigné'}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <MapPin size={18} className="text-gray-400" />
//             <span className="font-medium">Adresse:</span>
//             <span>{fiche.adresse_client || 'Non renseigné'}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <Mailbox size={18} className="text-gray-400" />
//             <span className="font-medium">Code postal:</span>
//             <span>{fiche.code_postal || 'Non renseigné'}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <Hash size={18} className="text-gray-400" />
//             <span className="font-medium">Pdl:</span>
//             <span>{fiche.pdl || 'Non renseigné'}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <Hash size={18} className="text-gray-400" />
//             <span className="font-medium">Pce:</span>
//             <span>{fiche.pce || 'Non renseigné'}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <Redo size={18} className="text-gray-400" />
//             <span className="font-medium">Assignée à:</span>
//             <span>{fiche.assignedToName || 'Non assignée'}</span>
//           </div>

//           <div className="flex items-center gap-2">
//             <Clock size={16} className="text-gray-400" />
//             <span className="font-medium">Date création:</span>
//             <span>{new Date(fiche.date_creation).toLocaleDateString('fr-FR')}</span>
//           </div>

//           {fiche.commentaire && (
//             <div className="bg-gray-50 p-3 rounded-md italic text-gray-600">
//               "{fiche.commentaire}"
//             </div>
//           )}

//           {fiche.tag && (
//             <div className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded uppercase tracking-wide font-semibold text-xs">
//               {fiche.tag}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };
// export default DetailModal;























// ------------------------------- Version Intermediaire ---------------------------------
// import React from "react";
// import {
//   X,
//   Phone,
//   Mail,
//   MapPin,
//   User,
//   Clock,
//   Smartphone,
//   Mailbox,
//   Redo,
//   Building2,
//   File,
//   BookmarkCheck,
//   Hash,
// } from "lucide-react";

// interface DetailModalProps {
//   fiche: any; // Remplacez par votre type exact
//   isOpen: boolean;
//   onClose: () => void;
// }

// const DetailModal: React.FC<DetailModalProps> = ({ fiche, isOpen, onClose }) => {
//   if (!isOpen || !fiche) return null;

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
//       <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative p-8">
//         {/* Bouton fermer */}
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition"
//           aria-label="Fermer la fenêtre"
//         >
//           <X size={22} />
//         </button>

//         {/* Titre */}
//         <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
//           <File size={22} className="text-indigo-500" />
//           Fiche N° {fiche.id}
//         </h2>

//         {/* Univers + statut */}
//         <div className="flex flex-wrap gap-3 mb-6">
//           <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
//             <BookmarkCheck size={16} />
//             {fiche.univers}
//           </span>
//           <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
//             Statut: {fiche.statut}
//           </span>
//         </div>

//         {/* Bloc Client */}
//         <div className="mb-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
//             <User size={18} className="text-gray-500" />
//             Client
//           </h3>
//           <p className="text-xl font-bold text-gray-900">
//             {fiche.nom_client} {fiche.prenom_client}
//           </p>
//         </div>

//         {/* Bloc Contact */}
//         <div className="mb-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-2">📞 Contact</h3>
//           <div className="space-y-2 text-sm text-gray-700">
//             <div className="flex items-center gap-2">
//               <Smartphone size={16} className="text-gray-400" />
//               <span>Mobile: {fiche.numero_mobile || "Non renseigné"}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Phone size={16} className="text-gray-400" />
//               <span>Fixe: {fiche.numero_fixe || "Non renseigné"}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Mail size={16} className="text-gray-400" />
//               <span>Email: {fiche.mail_client || "Non renseigné"}</span>
//             </div>
//           </div>
//         </div>

//         {/* Bloc Localisation */}
//         <div className="mb-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-2">📍 Localisation</h3>
//           <div className="space-y-2 text-sm text-gray-700">
//             <div className="flex items-center gap-2">
//               <Building2 size={16} className="text-gray-400" />
//               <span>Ville: {fiche.ville_client || "Non renseigné"}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <MapPin size={16} className="text-gray-400" />
//               <span>Adresse: {fiche.adresse_client || "Non renseigné"}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Mailbox size={16} className="text-gray-400" />
//               <span>Code postal: {fiche.code_postal || "Non renseigné"}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Hash size={16} className="text-gray-400" />
//               <span>pdl: {fiche.pdl || "Non renseigné"}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Hash size={16} className="text-gray-400" />
//               <span>pce: {fiche.pce || "Non renseigné"}</span>
//             </div>
//           </div>
//         </div>

//         {/* Date en bas */}
//         <div className="flex justify-end">
//         <p className="text-xs flex text-gray-500 mt-8 items-center gap-1">
//           <Clock size={14} />
//           Créée le :{" "}
//           {fiche.date_creation
//             ? new Date(fiche.date_creation).toLocaleString("fr-FR")
//             : "—"}
//         </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DetailModal;






















// ------------------------------- version Finale ---------------------------------
// import React from "react";
// import {
//     X,
//     Phone,
//     Mail,
//     MapPin,
//     User,
//     Clock,
//     Smartphone,
//     Mailbox,
//     Redo,
//     Building2,
//     File,
//     BookmarkCheck,
//     Hash,
// } from "lucide-react";

// interface DetailModalProps {
//     fiche: any; // Remplacez par votre type exact
//     isOpen: boolean;
//     onClose: () => void;
// }

// const DetailModal: React.FC<DetailModalProps> = ({ fiche, isOpen, onClose }) => {
//     if (!isOpen || !fiche) return null;

//     return (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
//             <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">

//                 {/* Header avec dégradé */}
//                 <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-t-2xl text-white">
//                     <button
//                         onClick={onClose}
//                         className="absolute top-4 right-4 text-white/80 hover:text-white"
//                         aria-label="Fermer la fenêtre"
//                     >
//                         <X size={22} />
//                     </button>
//                     <h2 className="text-2xl font-bold flex items-center gap-2">
//                         <File size={24} />
//                         Fiche N° {fiche.id}
//                     </h2>
//                     <div>
//                         <p className="text-sm opacity-90 mt-1">
//                             Univers : {fiche.univers}
//                         </p>
//                         <p className="text-sm opacity-90 mt-1">
//                             Statut : {fiche.statut}
//                         </p>
//                     </div>
//                 </div>

//                 {/* Contenu */}
//                 <div className="p-6 space-y-6">

//                     {/* Bloc Client */}
//                     <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
//                         <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-2">
//                             <User size={18} className="text-indigo-500" />
//                             Client
//                         </h3>
//                         <p className="text-xl font-bold text-gray-900">
//                             {fiche.nom_client} {fiche.prenom_client}
//                         </p>
//                     </div>

//                     {/* Bloc Contact */}
//                     <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
//                         <h3 className="text-lg font-semibold text-gray-800 mb-2">📞 Contact</h3>
//                         <ul className="space-y-2 text-sm text-gray-700">
//                             <li className="flex items-center gap-2">
//                                 <Smartphone size={16} className="text-gray-400" />
//                                 Mobile : {fiche.numero_mobile || "Non renseigné"}
//                             </li>
//                             <li className="flex items-center gap-2">
//                                 <Phone size={16} className="text-gray-400" />
//                                 Fixe : {fiche.numero_fixe || "Non renseigné"}
//                             </li>
//                             <li className="flex items-center gap-2">
//                                 <Mail size={16} className="text-gray-400" />
//                                 Email : {fiche.mail_client || "Non renseigné"}
//                             </li>
//                         </ul>
//                     </div>

//                     {/* Bloc Localisation */}
//                     <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
//                         <h3 className="text-lg font-semibold text-gray-800 mb-2">📍 Localisation</h3>
//                         <ul className="space-y-2 text-sm text-gray-700">
//                             <li className="flex items-center gap-2">
//                                 <Building2 size={16} className="text-gray-400" />
//                                 Ville : {fiche.ville_client || "Non renseigné"}
//                             </li>
//                             <li className="flex items-center gap-2">
//                                 <MapPin size={16} className="text-gray-400" />
//                                 Adresse : {fiche.adresse_client || "Non renseigné"}
//                             </li>
//                             <li className="flex items-center gap-2">
//                                 <Mailbox size={16} className="text-gray-400" />
//                                 Code postal : {fiche.code_postal || "Non renseigné"}
//                             </li>
//                             <li className="flex items-center gap-2">
//                                 <Hash size={16} className="text-gray-400" />
//                                 Pdl : {fiche.pdl || "Non renseigné"}
//                             </li>
//                             <li className="flex items-center gap-2">
//                                 <Mailbox size={16} className="text-gray-400" />
//                                 Pce : {fiche.pce || "Non renseigné"}
//                             </li>
//                         </ul>
//                     </div>

//                     {/* Date en bas */}
//                     <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
//                         <Clock size={14} className="text-gray-400" />
//                         Créée le :{" "}
//                         {fiche.date_creation
//                             ? new Date(fiche.date_creation).toLocaleString("fr-FR")
//                             : "—"}
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default DetailModal;
