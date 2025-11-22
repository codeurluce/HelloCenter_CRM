// FichesTable.tsx
import React from 'react';
import { Fiche } from './fiche.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { ActionButton } from './ActionButton.tsx';
import { Eye, FileUp, Trash2Icon, Repeat, FileText } from 'lucide-react';
import type { AdminFilterType } from '../componentsdesongletsAdmins/AdminFichiersPanel'; // ⬅️ chemin à ajuster si nécessaire

interface FichesTableProps {
  fiche: Fiche;
  activeFilter: AdminFilterType; // ✅ même type que le parent
  selectedFiches: number[];
  onAssign: (id: number, agentId?: number | null) => void;
  onDelete: (id: number) => void;
  onUnassign: (fiche: Fiche) => void;
  onOpenDetail: (fiche: Fiche) => void;
  onOpenHistorique: (ficheId: number) => void;
  toggleSelect: (id: number, checked: boolean) => void;
}

export const FichesTable: React.FC<FichesTableProps> = ({
  fiche,
  activeFilter,
  selectedFiches,
  onAssign,
  onDelete,
  onUnassign,
  onOpenDetail,
  onOpenHistorique,
  toggleSelect,
}) => {
  // On détermine si on est dans le cas "nouvelles non assignées"
  const isNouvellesView = activeFilter === 'nouvelles';

  return (
    <tr
      className={`border-t border-gray-200 transition-colors ${
        selectedFiches.includes(fiche.id) ? 'bg-blue-50' : 'hover:bg-blue-50'
      }`}
    >
      <td className="px-6 py-3 text-gray-800">{fiche.id}</td>
      <td className="px-6 py-3 text-gray-800 whitespace-nowrap">
        {fiche.nom_client} {fiche.prenom_client}
      </td>
      <td className="px-6 py-3 text-gray-800 whitespace-nowrap">{fiche.numero_mobile}</td>
      <td className="px-6 py-3 text-gray-800">
        <StatusBadge statut={fiche.statut} assigned_to={fiche.assigned_to} />
      </td>
      <td className="px-6 py-3 text-gray-800 whitespace-nowrap">
        {fiche.assigned_to_name || 'Non Assignée'}
      </td>
      <td className="px-6 py-3 text-gray-800">
        {new Date(fiche.date_import).toLocaleDateString('fr-FR')}
      </td>
      <td className="px-6 py-3 text-gray-800 flex justify-end gap-2">
        {isNouvellesView ? (
          <>
            <ActionButton
              onClick={() => onAssign(fiche.id, fiche.assigned_to ?? undefined)}
              icon={<FileUp className="w-4 h-4" />}
              tooltip="Assigner"
              colorClass="blue-600"
            />
            <ActionButton
              onClick={() => onOpenDetail(fiche)}
              icon={<Eye className="w-4 h-4" />}
              tooltip="Détails"
              colorClass="green-600"
            />
            <ActionButton
              onClick={() => onDelete(fiche.id)}
              icon={<Trash2Icon className="w-4 h-4" />}
              tooltip="Supprimer"
              colorClass="orange-600"
            />
          </>
        ) : (
          <>
            <ActionButton
              onClick={() => onOpenDetail(fiche)}
              icon={<Eye className="w-4 h-4" />}
              tooltip="Détails fiches"
              colorClass="green-600"
            />
            <ActionButton
              onClick={() => onDelete(fiche.id)}
              icon={<Trash2Icon className="w-4 h-4" />}
              tooltip="Supprimer"
              colorClass="orange-600"
            />
            <ActionButton
              onClick={() => onUnassign(fiche)}
              icon={<Repeat className="w-4 h-4" />}
              tooltip="Retirer"
              colorClass="purple-600"
            />
            <ActionButton
              onClick={() => onOpenHistorique(fiche.id)}
              icon={<FileText className="w-4 h-4" />}
              tooltip="Voir l'historique"
              colorClass="blue-600"
            />
          </>
        )}
      </td>
      <td className="px-6 py-3 text-gray-800">
        <input
          type="checkbox"
          checked={selectedFiches.includes(fiche.id)}
          onChange={(e) => toggleSelect(fiche.id, e.target.checked)}
        />
      </td>
    </tr>
  );
};