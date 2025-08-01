// component/componentsdesfiches/ClotureModal.tsx

import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { ClotureData, PREDEFINED_TAGS } from './types/fiche.ts';

interface ClotureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClotureData) => void;
  ficheId: number;
  clientName: string;
}

const ClotureModal: React.FC<ClotureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ficheId,
  clientName
}) => {
  const [formData, setFormData] = useState<ClotureData>({
    commentaire: '',
    tag: ''
  });
  const [errors, setErrors] = useState<Partial<ClotureData>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<ClotureData> = {};
    if (!formData.commentaire.trim()) {
      newErrors.commentaire = 'Le commentaire est obligatoire';
    }
    if (!formData.tag) {
      newErrors.tag = 'Veuillez sélectionner un tag';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({ commentaire: '', tag: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Clôturer la fiche</h2>
            <p className="text-sm text-gray-600 mt-1">
              Fiche #{ficheId} - {clientName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Motif de clôture *
            </label>
            <select
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.tag ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionnez un motif</option>
              {PREDEFINED_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            {errors.tag && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.tag}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Commentaire *
            </label>
            <textarea
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              placeholder="Décrivez les actions réalisées et la raison de la clôture..."
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                errors.commentaire ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.commentaire && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.commentaire}</span>
              </div>
            )}
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.commentaire.length}/500 caractères
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check size={16} />
              Clôturer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClotureModal;