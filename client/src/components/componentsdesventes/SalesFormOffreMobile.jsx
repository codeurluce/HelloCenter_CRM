import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

const SalesFormOffreMobile = ({ formData, setFormData, onSubmit, onClose }) => {
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'fichier') {
      setFormData(prev => ({ ...prev, [name]: files[0] || null }));
    } else if (name === 'engagement') {
      setFormData(prev => ({ ...prev, [name]: value === 'Oui' })); // Convertit "Oui"/"Non" en true/false
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation des champs obligatoires
    if (
      !formData.free_agent_account ||
      !formData.civilite ||
      !formData.nomClient ||
      !formData.prenomClient ||
      !formData.emailClient ||
      !formData.numMobile ||
      !formData.engagement ||
      !formData.typeTechnologie ||
      !formData.prixOffre ||
      !formData.ancienOperateur ||
      !formData.provenanceFichier
    ) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Identifiant Agent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Identifiant Agent *</label>
          <input
            type="text"
            name="free_agent_account"
            value={formData.free_agent_account || ''}
            onChange={handleChange}
            placeholder="ex : mdz-nomAgent"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Civilité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Civilité *</label>
          <select
            name="civilite"
            value={formData.civilite || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner</option>
            <option value="Mr">Mr</option>
            <option value="Mme">Mme</option>
          </select>
        </div>

        {/* Nom client */}
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

        {/* Prénom client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prénom client *</label>
          <input
            type="text"
            name="prenomClient"
            value={formData.prenomClient || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email client *</label>
          <input
            type="email"
            name="emailClient"
            value={formData.emailClient || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Ville */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
          <input
            type="text"
            name="villeClient"
            value={formData.villeClient || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
          <input
            type="text"
            name="adresseClient"
            value={formData.adresseClient || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Code Postal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Code Postal</label>
          <input
            type="text"
            name="codePostal"
            value={formData.codePostal || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Numéro mobile */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numéro Mobile *</label>
          <input
            type="tel"
            name="numMobile"
            value={formData.numMobile || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Numéro fixe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numéro Fixe</label>
          <input
            type="tel"
            name="numFixe"
            value={formData.numFixe || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* RIO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">RIO</label>
          <input
            type="text"
            name="rio"
            value={formData.rio || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Engagement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Engagement *</label>
          <select
            name="engagement"
            value={formData.engagement !== undefined ? (formData.engagement ? 'Oui' : 'Non') : 'Sélectionner'}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner</option>
            <option value="Oui">Oui</option>
            <option value="Non">Non</option>
          </select>
        </div>

        {/* Type Technologie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type de Technologie *</label>
          <select
            name="typeTechnologie"
            value={formData.typeTechnologie || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner</option>
            <option value="Box">Box</option>
            <option value="Mobile">Mobile</option>
          </select>
        </div>

        {/* Prix Offre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prix Offre *</label>
          <select
            name="prixOffre"
            value={formData.prixOffre || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner</option>
            <option value="8,99€ Serie Free">8,99€ Serie Free</option>
            <option value="9,99€">9,99€</option>
            <option value="19,99€ / 29,99€">19,99€ / 29,99€</option>
            <option value="29,99€ / 39,99€">29,99€ / 39,99€</option>
            <option value="39,99€ / 49,99€">39,99€ / 49,99€</option>
            <option value="49,99€ / 59,99€">49,99€ / 59,99€</option>
            <option value="Autre">Autre</option>
          </select>
          {formData.prixOffre === 'Autre' && (
            <input
              type="text"
              name="prixOffreAutre"
              value={formData.prixOffreAutre || ''}
              onChange={handleChange}
              placeholder="Saisir le prix"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>

        {/* Ancien Opérateur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ancien Opérateur *</label>
          <input
            type="text"
            name="ancienOperateur"
            value={formData.ancienOperateur || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* PTO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">PTO</label>
          <input
            type="text"
            name="pto"
            value={formData.pto || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Option Smartphone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Option Smartphone</label>
          <input
            type="text"
            name="optionSmartphone"
            value={formData.optionSmartphone || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Autres Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Autres Options</label>
          <input
            type="text"
            name="autresOptions"
            value={formData.autresOptions || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Etat CMD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Etat CMD</label>
          <input
            type="text"
            name="etatCmd"
            value={formData.etatCmd || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* REF CMD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Réf CMD</label>
          <input
            type="text"
            name="refCmd"
            value={formData.refCmd || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* IBAN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
          <input
            type="text"
            name="iban"
            value={formData.iban || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Provenance fichier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Provenance fichier *</label>
          <select
            name="provenanceFichier"
            value={formData.provenanceFichier || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner</option>
            <option value="Lead">Lead</option>
            <option value="Conquête">Conquête</option>
          </select>
        </div>

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
