// src/componentsdesfiches/ClotureModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, CalendarPlus } from 'lucide-react';
import { ClotureData, PREDEFINED_TAGS, Fiche } from './types/fiche.ts';
import CreateSaleFromFicheModal from './CreateSaleFromFicheModal.tsx';
import FormTypeSelector from '../componentsdesventes/FormTypeSelector';
import { toast } from 'react-toastify';
import { createSale } from '../../api/salesActions.js';

interface ClotureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClotureData) => void; // fonction pour clôturer la fiche
  ficheId: number;
  clientName: string;
  fiche: Fiche | null;
  onProgramRdv: (id: number) => void;
  onSaveNRP: (id: number, data: ClotureData) => void;
}

const ClotureModal: React.FC<ClotureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ficheId,
  clientName,
  fiche,
  onProgramRdv,
  onSaveNRP,
}) => {

  const [formData, setFormData] = useState<ClotureData>({
    commentaire: '',
    tag: ''
  });

  const [errors, setErrors] = useState<Partial<ClotureData>>({});
  const [showFormTypeSelector, setShowFormTypeSelector] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleInitialData, setSaleInitialData] = useState<any>(null);
  const [submittingSale, setSubmittingSale] = useState(false);
  const [selectedTag, setSelectedTag] = React.useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFormData({ commentaire: '', tag: '' });
      setErrors({});
      setShowFormTypeSelector(false);
      setShowSaleModal(false);
      setSaleInitialData(null);
    }
  }, [isOpen, ficheId]);

  if (!isOpen || !fiche) return null;

  const handleClose = () => {
    setFormData({ commentaire: '', tag: '' });
    setErrors({});
    setShowFormTypeSelector(false);
    setShowSaleModal(false);
    setSaleInitialData(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiche) return;

    const newErrors: Partial<ClotureData> = {};
    if (!formData.tag) newErrors.tag = 'Veuillez sélectionner un tag';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Si tag Relance ou Rappel → RDV
    if (formData.tag === 'Relance (RL)' || formData.tag === 'Rappel (R)') {
      onProgramRdv(fiche.id); // déclenche le bouton RDV
      handleClose();
      return;
    }

    // Si tag Vente → processus vente
    if (formData.tag === 'Vente') {
      const ficheData = {
        nomClient: fiche.nom_client,
        prenomClient: fiche.prenom_client,
        adresseClient: fiche.adresse_client || "",
        codePostal: fiche.code_postal || "",
        villeClient: fiche.ville_client || "",
        emailClient: fiche.mail_client || "",
        numMobile: fiche.numero_mobile || "",
        pdl: fiche.pdl || "",
        pce: fiche.pce || "",
        product_type: null
      };
      setSaleInitialData(ficheData);
      setShowFormTypeSelector(true);
      return; // ne pas clôturer tout de suite
    }

    // Sinon → clôture normale
    onSubmit(formData);
    handleClose();
  };

const handleSaveNRP = async () => {
  if (!fiche) return;

  if (!formData.commentaire || !formData.commentaire.trim()) {
    toast.error("Veuillez renseigner un commentaire avant d'enregistrer !");
    return;
  }

  try {
    await onSaveNRP(fiche.id, {
      tag: formData.tag,
      commentaire: formData.commentaire
    });

    toast.success("Commentaire enregistré !");
    handleClose();

  } catch (err) {
    console.error(err);
    toast.error("Impossible d'enregistrer le commentaire !");
  }
};

  const handleFormTypeSelect = (type: 'energie' | 'offreMobile') => {
    if (!saleInitialData) return;
    // On complète saleInitialData avec le type choisi
    const updatedSaleData = { ...saleInitialData, product_type: type };
    setSaleInitialData(updatedSaleData);

    setShowFormTypeSelector(false);
    setShowSaleModal(true);
  };

  // Soumission du formulaire de vente
  const handleSaleSubmit = async (formDataFromModal: any) => {
    if (!saleInitialData?.product_type) {
      toast.error("Veuillez sélectionner le type de vente !");
      return;
    }

    setSubmittingSale(true);

    try {
      // Fusionner les données initiales + celles du formulaire
      const saleDataToSend = { ...saleInitialData, ...formDataFromModal };

      // Appel API
      const response = await createSale(saleDataToSend);

      toast.success("✅ Vente créée avec succès !");
      setShowSaleModal(false);

      // Clôturer la fiche après succès
      onSubmit({
        commentaire: formData.commentaire,
        tag: formData.tag
      });

      handleClose();
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || "❌ Erreur lors de la création de la vente";
      toast.error(message);
    } finally {
      setSubmittingSale(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Clôturer la fiche</h2>
            <p className="text-sm text-gray-600 mt-1">
              Fiche #{ficheId} - {clientName}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Motif de clôture *
            </label>
            <select
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg ${errors.tag ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            >
              <option value="">Sélectionnez un motif</option>
              {PREDEFINED_TAGS.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
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
              Commentaire
            </label>
            <textarea
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg resize-none ${errors.commentaire ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.commentaire && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.commentaire}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>

              {/* --- Bouton ENREGISTRER pour NRP --- */}
{formData.tag === "Ne répond pas (NRP)" && (
  <button
    type="button"
    onClick={() => {
      handleSaveNRP();
    }}
    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white bg-amber-600 hover:bg-amber-700"
  >
    <Check size={16} /> Enregistrer
  </button>
)}

            {/* ici il faut mettre le bouton rdv supprimer dans fichecard qui saffiche si on clique sur le tag relance ou rappel */}
            <button
              type="submit"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white 
                          ${formData.tag === 'Vente' ? 'bg-blue-600 hover:bg-blue-700' :
                  formData.tag === 'Relance (RL)' || formData.tag === 'Rappel (R)' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'}`}
              disabled={submittingSale}
            >
              {formData.tag === 'Vente' ? (
                <>
                  <Check size={16} /> Vendre
                </>
              ) : formData.tag === 'Relance (RL)' || formData.tag === 'Rappel (R)' ? (
                <>
                  <CalendarPlus size={16} /> Rendez-vous
                </>
              ) : (
                <>
                  <Check size={16} /> Clôturer
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showFormTypeSelector && (
        <FormTypeSelector
          onSelect={handleFormTypeSelect}
          onClose={() => setShowFormTypeSelector(false)}
        />
      )}

      {showSaleModal && saleInitialData && (
        <CreateSaleFromFicheModal
          isOpen={showSaleModal}
          onClose={() => setShowSaleModal(false)}
          initialData={saleInitialData}
          onSubmit={handleSaleSubmit}
        />
      )}
    </div>
  );
};

export default ClotureModal;