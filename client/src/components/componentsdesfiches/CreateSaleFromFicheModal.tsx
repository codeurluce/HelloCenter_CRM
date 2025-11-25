// component/componentsdesfiches/CreateSaleFromFicheModal.tsx
import React, { useState } from "react";
import { X, Check } from "lucide-react";
import SalesFormEnergie from "../componentsdesventes/SalesFormEnergie";
import SalesFormOffreMobile from "../componentsdesventes/SalesFormOffreMobile";

interface CreateSaleFromFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any; // données préremplies depuis la fiche
  onSubmit: (data: any) => void;
}

const CreateSaleFromFicheModal: React.FC<CreateSaleFromFicheModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
}) => {

    const [formType, setFormType] = useState<string>(() => {
  if (!initialData?.product_type) return "";
  return initialData.product_type.toLowerCase();
});
  const [formData, setFormData] = useState<any>(initialData);

  if (!isOpen) return null;

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {formType === "energie" ? "Nouvelle vente - Énergie" : "Nouvelle vente - Offre Mobile"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Formulaire dynamique */}
        {formType === "energie" ? (
          <SalesFormEnergie
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleFormSubmit}
            onClose={handleClose}
          />
        ) : (
          <SalesFormOffreMobile
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleFormSubmit}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
};

export default CreateSaleFromFicheModal;