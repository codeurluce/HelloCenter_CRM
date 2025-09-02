import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Fiche } from './fiche';

interface EditFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ficheData: Partial<Fiche>) => void;
  fiche: Fiche | null;
}

const EditFicheModal: React.FC<EditFicheModalProps> = ({
  isOpen,
  onClose,
  onSave,
  fiche
}) => {
  const [formData, setFormData] = useState<Partial<Fiche>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (fiche) {
      setFormData({
        nom_client: fiche.nom_client,
        prenom_client: fiche.prenom_client,
        numero_mobile: fiche.numero_mobile,
        mail_client: fiche.mail_client,
        adresse_client: fiche.adresse_client,
        code_postal: fiche.code_postal,
        univers: fiche.univers,
        commentaire: fiche.commentaire || '',
      });
    }
  }, [fiche]);

  const universOptions = [
    'Assurance Auto',
    'Assurance Habitation',
    'Assurance Santé',
    'Assurance Vie',
    'Épargne',
    'Crédit',
    'Autre'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom_client?.trim()) {
      newErrors.nom_client = 'Le nom est obligatoire';
    }
    if (!formData.prenom_client?.trim()) {
      newErrors.prenom_client = 'Le prénom est obligatoire';
    }
    if (!formData.numero_mobile?.trim()) {
      newErrors.numero_mobile = 'Le numéro de téléphone est obligatoire';
    }
    if (!formData.mail_client?.trim()) {
      newErrors.mail_client = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(formData.mail_client)) {
      newErrors.mail_client = 'Format d\'email invalide';
    }
    if (!formData.univers?.trim()) {
      newErrors.univers = 'L\'univers est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof Fiche, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  if (!isOpen || !fiche) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Modifier la fiche</h2>
            <p className="text-gray-600 mt-1">Fiche #{fiche.id}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Informations client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                value={formData.nom_client || ''}
                onChange={(e) => handleInputChange('nom_client', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.nom_client ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Nom du client"
              />
              {errors.nom_client && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.nom_client}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                value={formData.prenom_client || ''}
                onChange={(e) => handleInputChange('prenom_client', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.prenom_client ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Prénom du client"
              />
              {errors.prenom_client && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.prenom_client}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                value={formData.numero_mobile || ''}
                onChange={(e) => handleInputChange('numero_mobile', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.numero_mobile ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0123456789"
              />
              {errors.numero_mobile && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.numero_mobile}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.mail_client || ''}
                onChange={(e) => handleInputChange('mail_client', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.mail_client ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="client@email.com"
              />
              {errors.mail_client && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.mail_client}</span>
                </div>
              )}
            </div>
          </div>

          {/* Adresse */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={formData.adresse_client || ''}
                onChange={(e) => handleInputChange('adresse_client', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="123 Rue de la République"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code postal
              </label>
              <input
                type="text"
                value={formData.code_postal || ''}
                onChange={(e) => handleInputChange('code_postal', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="75001"
              />
            </div>
          </div>

          {/* Univers */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Univers *
            </label>
            <select
              value={formData.univers || ''}
              onChange={(e) => handleInputChange('univers', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.univers ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionnez un univers</option>
              {universOptions.map((univers) => (
                <option key={univers} value={univers}>
                  {univers}
                </option>
              ))}
            </select>
            {errors.univers && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.univers}</span>
              </div>
            )}
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Commentaire
            </label>
            <textarea
              value={formData.commentaire || ''}
              onChange={(e) => handleInputChange('commentaire', e.target.value)}
              placeholder="Informations complémentaires..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFicheModal;