import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import SalesFormEnergie from '../componentsdesventes/SalesFormEnergie';
import SalesFormOffreMobile from '../componentsdesventes/SalesFormOffreMobile';
import FormTypeSelector from '../componentsdesventes/FormTypeSelector';
import FiltreSalesList from '../componentsdesventes/FiltreSalesList';

const VentesInfoPanel = () => {
  const [sales, setSales] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const handleOpenSelector = () => setShowSelector(true);

  const handleSelectFormType = (type) => {
    setFormType(type);
    setFormData({});
    setShowSelector(false);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormType(null);
    setFormData({});
  };

  const handleSubmitSale = (data) => {
    const newSale = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      agent: 'Marie Dupont',
      ...data
    };
    setSales(prev => [newSale, ...prev]);
    handleCloseForm();
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'validated': return 'Validée';
      case 'cancelled': return 'Annulée';
      case 'CHF': return 'CHF';
      case 'MSV': return 'MSV';
      default: return status || 'Inconnu';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header + Nouveau */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Historique des ventes</h2>
        <button
          onClick={handleOpenSelector}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          type="button"
          aria-label="Nouvelle vente"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle vente</span>
        </button>
      </div>

      {/* FiltreSalesList gère les filtres ET la liste */}
      <FiltreSalesList
        sales={sales}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onDeleteSale={id => setSales(prev => prev.filter(s => s.id !== id))}
        getStatusText={getStatusText}
      />

      {/* Popup choix type */}
      {showSelector && (
        <FormTypeSelector
          onSelect={handleSelectFormType}
          onClose={() => setShowSelector(false)}
        />
      )}

      {/* Formulaire dynamique */}
      {showForm && formType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {formType === 'energie' ? 'Nouvelle vente - Énergie' : 'Nouvelle vente - Offre Mobile'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fermer formulaire"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formType === 'energie' ? (
              <SalesFormEnergie
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmitSale}
                onClose={handleCloseForm}
              />
            ) : (
              <SalesFormOffreMobile
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmitSale}
                onClose={handleCloseForm}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VentesInfoPanel;
