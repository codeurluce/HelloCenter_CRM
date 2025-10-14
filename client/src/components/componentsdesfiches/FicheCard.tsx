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