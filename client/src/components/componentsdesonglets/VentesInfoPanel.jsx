import React, { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import SalesFormEnergie from '../componentsdesventes/SalesFormEnergie';
import SalesFormOffreMobile from '../componentsdesventes/SalesFormOffreMobile';
import FormTypeSelector from '../componentsdesventes/FormTypeSelector';
import FiltreSalesList from '../componentsdesventes/FiltreSalesList';
import { deleteSale } from "../../api/salesActions";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';
import SaleDetailsModal from '../componentsdesventes/SaleDetailsModal'; // Assurez-vous d'avoir ce composant pour afficher les détails d'une vente


const VentesInfoPanel = () => {
  const [sales, setSales] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [saleToView, setSaleToView] = useState(null);


  const handleOpenSelector = () => setShowSelector(true);
  const handleSelectFormType = (type) => {
    setFormType(type);
    setFormData({ product_type: type });
    setShowSelector(false);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormType(null);
    setFormData({});
  };

  // Soumission du formulaire
  const handleSubmitSale = async (data) => {
    try {
      // Ici tu peux faire un appel API pour enregistrer la vente dans la BDD
      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data), // product_type envoyé aussi
      });

      if (!response.ok) throw new Error('Erreur sauvegarde vente');
      const savedSale = await response.json();
      setSales(prev => [savedSale, ...prev]);   // Met à jour la liste des ventes avec la vente sauvegardée côté backend

      toast.success("✅ Vente enregistrée avec succès !");
      handleCloseForm(); // Ferme le formulaire après la soumission
    } catch (error) {
      console.error('Erreur sauvegarde vente:', error);
      toast.error("❌ Une erreur s'est produite lors de l'enregistrement");
    }
  };

// Suppression d'une vente
const handleDeleteSale = async (id) => {
  Swal.fire({
    title: 'Supprimer la vente ?',
    text: "Cette action est irréversible.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await deleteSale(id); // suppression via API
        setSales(prev => prev.filter(s => s.id !== id)); // mise à jour liste locale
        Swal.fire({
          icon: 'success',
          title: 'Supprimé !',
          text: 'La vente a été supprimée avec succès.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de supprimer la vente.'
        });
      }
    }
  });
};

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/sales', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
        });
        if (!response.ok) throw new Error('Erreur chargement ventes');
        const data = await response.json();
        setSales(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSales();
  }, []);

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Default';
      case 'validated': return 'Payée';
      case 'cancelled': return 'Annulée';
      case 'CHF': return 'CHF';
      case 'MSV': return 'MSV';
      case 'Energie': return 'Énergie';
      case 'Offre Mobile': return 'Offre Mobile';
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
        onDeleteSale={handleDeleteSale}
        getStatusText={getStatusText}
        onViewSale={setSaleToView}
      />

      {/* Détails de la vente sélectionnée */}
      <SaleDetailsModal
      sale={saleToView}
      onClose={() => setSaleToView(null)}
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