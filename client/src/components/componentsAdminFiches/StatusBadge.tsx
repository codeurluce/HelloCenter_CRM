// Le composant StatusBadge affiche un badge de statut pour une fiche donnée en fonction de son statut et de son affectation.
import React from 'react';

interface StatusBadgeProps {
  statut: string;
  assigned_to?: number | null;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ statut, assigned_to }) => {
  let bgColor, textColor, label;
  if (statut === 'nouvelle' && !assigned_to) { bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; label = 'Nouvelle'; }
  else if (statut === 'nouvelle' && assigned_to) { bgColor = 'bg-purple-100'; textColor = 'text-purple-800'; label = 'Assignée'; }
  else if (statut === 'en_traitement') { bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; label = 'En traitement'; }
  else if (statut === 'rendez_vous') { bgColor = 'bg-amber-100'; textColor = 'text-amber-800'; label = 'RDV'; }
  else if (statut === 'cloturee') { bgColor = 'bg-green-100'; textColor = 'text-green-800'; label = 'Clôturée'; }
  else { bgColor = 'bg-gray-100'; textColor = 'text-gray-800'; label = statut; }

  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>{label}</span>;
};