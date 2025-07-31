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
} from 'lucide-react';
import { Fiche } from './types/fiche.ts';

interface FicheCardProps {
  fiche: Fiche;
  currentAgent: string;
  onTreatFiche: (id: number) => void;
  onCloseFiche: (id: number) => void;
  onProgramRdv: (id: number) => void;
  onCancelFiche: (id: number) => void;
}

const FicheCard: React.FC<FicheCardProps> = ({
  fiche,
  currentAgent,
  onTreatFiche,
  onCloseFiche,
  onProgramRdv,
  onCancelFiche,
}) => {
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'nouvelle':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_traitement':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
      case 'cloturee':
        return 'Clôturée';
      default:
        return statut;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
  };
// console.log('🎯 Agent connecté dans FicheCard :', currentAgent);
// console.log('📋 Fiche assignée à :', fiche.assignedTo);
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

          {/* Affiche le badge avec initiales si la fiche est en traitement */}
          {fiche.statut === 'en_traitement' && fiche.assignedToName && (
            <div
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow" translate="no"
              title={fiche.assignedToName}
            >
              {getInitials(fiche.assignedToName)}
            </div>
          )}
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
                <span className="font-medium" translate="no">{fiche.assignedToName}</span>
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
            onClick={() => onTreatFiche(fiche.id)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Play size={16} />
            Prendre en charge
          </button>
        )}

        {/* Actions fiche en traitement par l’agent courant */}
        {fiche.statut === 'en_traitement' &&
          fiche.assignedTo === currentAgent && (
            <>
            <button
                onClick={() => onCloseFiche(fiche.id)}
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
              <button
                onClick={() => onCancelFiche(fiche.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
              >
                Annuler
              </button>
            </>
          )}
      </div>
    </div>
  );
};

export default FicheCard;