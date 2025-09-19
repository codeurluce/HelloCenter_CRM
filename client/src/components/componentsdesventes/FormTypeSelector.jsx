import React from 'react';

// Popup de choix type de vente
const FormTypeSelector = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-80 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Choisir le type de vente</h3>
        <button
          onClick={() => onSelect('energie')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
        >
          Vente Énergie
        </button>
        <button
          onClick={() => onSelect('offreMobile')}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
        >
          Offre Mobile
        </button>
        <button
          onClick={onClose}
          className="w-full mt-2 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-100"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};
export default FormTypeSelector;