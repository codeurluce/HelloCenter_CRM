import React from 'react';
import { X, Send } from 'lucide-react';

const partenaires = ['Artesia', 'Partenaire A', 'Partenaire B', 'Partenaire C'];

// Formulaire Vente Énergie
const SalesFormEnergie = ({ formData, setFormData, onSubmit, onClose }) => {
  const showPDL = formData.energie === 'Electricite';
  const showPCE = formData.energie === 'Gaz';

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'fichier') {
      setFormData(prev => ({ ...prev, [name]: files[0] || null }));
    } else {
      if (name === 'energie') {
        setFormData(prev => ({ ...prev, pdl: '', pce: '', energie: value }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.partenaire ||
      !formData.civilite ||
      !formData.nomClient ||
      !formData.prenomClient ||
      !formData.emailClient ||
      !formData.numMobile ||
      !formData.villeClient ||
      !formData.adresseClient ||
      !formData.codePostal ||
      !formData.refClient ||
      !formData.energie ||
      (formData.energie === 'Electricite' && !formData.pdl) ||
      (formData.energie === 'Gaz' && !formData.pce) ||
      !formData.natureOffre ||
      !formData.puissanceCompteur ||
      !formData.etatContrat
    ) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Partenaire *</label>
          <select
            name="partenaire"
            value={formData.partenaire || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner un partenaire</option>
            {partenaires.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>


<div>
          <label className="block text-sm font-medium text-gray-700 mb-2">civilite *</label>
          <select
            name="civilite"
            value={formData.civilite || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner Civilité</option>
            <option value="Mr">Mr</option>
            <option value="Mme">Mdme</option>
            <option value="Mlle">Mlle</option>
            <option value="Autre">Autre</option>
          </select>
        </div>


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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Num mobile client *</label>
          <input
            type="tel"
            name="numMobile"
            value={formData.numMobile || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Num fixe</label>
          <input
            type="tel"
            name="numFixe"
            value={formData.numFixe || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ville client *</label>
          <input
            type="text"
            name="villeClient"
            value={formData.villeClient || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adresse client *</label>
          <input
            type="text"
            name="adresseClient"
            value={formData.adresseClient || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Code postal *</label>
          <input
            type="text"
            name="codePostal"
            value={formData.codePostal || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Réf client *</label>
          <input
            type="text"
            name="refClient"
            value={formData.refClient || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Réf Contrat</label>
          <input
            type="text"
            name="refContrat"
            value={formData.refContrat || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Energie *</label>
          <select
            name="energie"
            value={formData.energie || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner énergie</option>
            <option value="Electricite">Electricité</option>
            <option value="Gaz">Gaz</option>
          </select>
        </div>

        {showPDL && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PDL *</label>
            <input
              type="text"
              name="pdl"
              value={formData.pdl || ''}
              onChange={handleChange}
              required={showPDL}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {showPCE && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PCE *</label>
            <input
              type="text"
              name="pce"
              value={formData.pce || ''}
              onChange={handleChange}
              required={showPCE}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nature Offre *</label>
          <input
            type="text"
            name="natureOffre"
            value={formData.natureOffre || ''}
            onChange={handleChange}
            required
            placeholder="Nature de l'offre"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Puissance compteur *</label>
          <input
            type="text"
            name="puissanceCompteur"
            value={formData.puissanceCompteur || ''}
            onChange={handleChange}
            required
            placeholder="Ex: 6 kVA"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Etat Contrat *</label>
          <select
            name="etatContrat"
            value={formData.etatContrat || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner état</option>
            <option value="CHF">CHF</option>
            <option value="MES">MES</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ajouter fichier</label>
          <input
            type="file"
            name="fichier"
            onChange={handleChange}
            className="w-full"
            accept="image/*,application/pdf"
          />
          {formData.fichier && (
            <p className="mt-2 text-sm text-gray-600">Fichier sélectionné : {formData.fichier.name}</p>
          )}
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
export default SalesFormEnergie;