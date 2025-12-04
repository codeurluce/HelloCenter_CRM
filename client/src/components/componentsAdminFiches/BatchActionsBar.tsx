// src/components/componentsAdminFiches/BatchActionsBar.tsx
import React from 'react';
import { UserPlus, Repeat, Trash2Icon } from 'lucide-react';
import { AdminFilterType } from '../componentsdesongletsAdmins/AdminFichiersPanel';

interface BatchActionsBarProps {
  batchSize: number | '';
  selectedFichesCount: number;
  activeFilter: AdminFilterType;
  onBatchSizeChange: (value: number | '') => void;
  onAssignBatch: () => void;
  onBatchUnassign: () => void;
  onBatchDelete: () => void;
  isAdmin: boolean;
  isManager: boolean;
}

const BatchActionsBar: React.FC<BatchActionsBarProps> = ({
  batchSize,
  selectedFichesCount,
  activeFilter,
  onBatchSizeChange,
  onAssignBatch,
  onBatchUnassign,
  onBatchDelete,
  isAdmin,
  isManager,
}) => {

  // Aucun rôle → rien à afficher
  if (!isAdmin && !isManager) return null;

  return (

    <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 rounded-lg border">

      {/* Affichage du nombre de fiches sélectionnées */}
      <p className="text-gray-800 font-semibold">
        {selectedFichesCount} fiche(s) sélectionnée(s)
      </p>
      {isAdmin && (
        <div className="flex items-center gap-3 mb-4">
          <label>Nombre de fiches :</label>
          <select
            value={batchSize}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                onBatchSizeChange('');
              } else {
                const num = Number(raw);
                onBatchSizeChange(isNaN(num) ? '' : num);
              }
            }}
            className="px-2 py-1 border rounded"
          >
            <option value="">-- Choisir --</option>
            {[5, 10, 20, 30, 50, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          {selectedFichesCount > 0 && (
            <>
              <button
                onClick={onAssignBatch}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <UserPlus size={18} /> Assigner {selectedFichesCount} fiches
              </button>

              <div className="flex items-center gap-3 ml-auto">
                {activeFilter !== 'nouvelles' && (
                  <button
                    onClick={onBatchUnassign}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow"
                  >
                    <Repeat size={18} />
                    Retirer {selectedFichesCount} fiche(s)
                  </button>
                )}

                <button
                  onClick={onBatchDelete}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow"
                >
                  <Trash2Icon size={18} />
                  Supprimer {selectedFichesCount} fiche(s)
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchActionsBar;