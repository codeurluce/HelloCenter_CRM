// Le composant StatusBadge affiche un badge de statut pour une fiche donnée en fonction de son statut et de son affectation.
import React from 'react';

interface StatusBadgeProps {
  statut: string;
  assigned_to?: number | null;
  tag?: string;
}

const tagMap: Record<string, { label: string; colorClass: string }> = {
  'Ne répond pas (NRP)': { label: 'NRP', colorClass: 'bg-orange-500 text-white' },
  "Refus d'Entretien (RE)": { label: 'RE', colorClass: 'bg-orange-500 text-white' },
  'Repondeur (Rep)': { label: 'REPD', colorClass: 'bg-orange-500 text-white' },
  'Refus Argumenté (RA)': { label: 'RA', colorClass: 'bg-orange-500 text-white' },
  'Vente': { label: 'Vente', colorClass: 'bg-green-500 text-white' },
  'Rappel (R)': { label: 'RPL', colorClass: 'bg-orange-500 text-white' },
  'Relance (RL)': { label: 'RL', colorClass: 'bg-orange-500 text-white' },
  'Faux Numéro (FN)': { label: 'FN', colorClass: 'bg-orange-500 text-white' },
  'Hors Cible': { label: 'HC', colorClass: 'bg-orange-500 text-white' },
};


export const StatusBadge: React.FC<StatusBadgeProps> = ({ statut, assigned_to, tag }) => {
  let bgColor, textColor, label;
  if (statut === 'nouvelle' && !assigned_to) { bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; label = 'Nouvelle'; }
  else if (statut === 'nouvelle' && assigned_to) { bgColor = 'bg-purple-100'; textColor = 'text-purple-800'; label = 'Assignée'; }
  else if (statut === 'en_traitement') { bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; label = 'En traitement'; }
  else if (statut === 'rendez_vous') { bgColor = 'bg-amber-100'; textColor = 'text-amber-800'; label = 'RDV'; }
  else if (statut === 'cloturee') { bgColor = 'bg-green-100'; textColor = 'text-green-800'; label = 'Clôturée'; }
  else { bgColor = 'bg-gray-100'; textColor = 'text-gray-800'; label = statut; }


  const tagInfo = tag ? tagMap[tag] : undefined;

  return (
    <div className="flex items-center gap-2">
      {/* Badge principal : statut */}
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>
        {label}
      </span>

      {/* Badge secondaire : tag */}
      {tagInfo && (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${tagInfo.colorClass}`}>
          {tagInfo.label}
        </span>
      )}
    </div>
  );
};