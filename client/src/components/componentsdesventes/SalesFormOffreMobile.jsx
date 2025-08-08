import React, { useState } from 'react';
import { X, Send, Eye, Edit, Trash2, Plus, Search, Filter } from 'lucide-react';

// Formulaire Vente Offre Mobile (simplifié)
const SalesFormOffreMobile = ({ formData, setFormData, onSubmit, onClose }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nomClient) {
      alert('Veuillez remplir le nom du client.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom client *</label>
          <input
            type="text"
            name="nomClient"
            value={formData.nomClient || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {/* Ajouter d'autres champs si nécessaire */}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Soumettre</span>
        </button>
      </div>
    </form>
  );
};
export default SalesFormOffreMobile;