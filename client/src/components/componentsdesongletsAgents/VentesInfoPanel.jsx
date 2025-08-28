import React, { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import SalesFormEnergie from '../componentsdesventes/SalesFormEnergie';
import SalesFormOffreMobile from '../componentsdesventes/SalesFormOffreMobile';
import FormTypeSelector from '../componentsdesventes/FormTypeSelector';
import FiltreSalesList from '../componentsdesventes/FiltreSalesList';
import SaleDetailsModal from '../componentsdesventes/SaleDetailsModal';
import { deleteSale, updateSale, createSale } from "../../api/salesActions";
import { toast } from "react-toastify";
import axiosInstance from '../../api/axiosInstance';

const VentesInfoPanel = ({ agentId }) => {
  const [sales, setSales] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [saleToView, setSaleToView] = useState(null);
  const [saleToEdit, setSaleToEdit] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  /*** Lecture du rôle depuis localStorage ***/
  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsAdmin(role === "Admin");
  }, []);

  /*** Chargement ventes ***/
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const endpoint = isAdmin ? '/sales/admin' : '/sales';
        const response = await axiosInstance.get(endpoint);
        setSales(response.data);
      } catch (error) {
        console.error('Erreur chargement ventes:', error);
      }
    };
    fetchSales();
  }, [isAdmin]);

  /*** Sélecteur et formulaire ***/
  const handleOpenSelector = () => setShowSelector(true);

  const handleSelectFormType = (type) => {
    setFormType(type);
    setFormData({ product_type: type });
    setShowSelector(false);
    setShowForm(true);
  };

  const handleEditSale = (sale) => {
    const mappedFormData = {
      partenaire: sale.partenaire,
      civilite: sale.civilite,
      nomClient: sale.client_name || '',
      prenomClient: sale.client_firstname || '',
      emailClient: sale.client_email || '',
      numMobile: sale.client_phone || '',
      numFixe: sale.client_phone_fix || '',
      villeClient: sale.ville_client || '',
      adresseClient: sale.adresse_client || '',
      codePostal: sale.code_postal_client || '',
      refClient: sale.ref_client || '',
      refContrat: sale.ref_contrat || '',
      energie: sale.energie || '',
      pdl: sale.pdl || '',
      pce: sale.pce || '',
      natureOffre: sale.nature_offre || '',
      puissanceCompteur: sale.puissance_compteur || '',
      etatContrat: sale.etat_contrat || '',
      fichier: sale.fichier || null,
    };
    setSaleToEdit(sale);
    setFormType(sale.product_type === 'energie' ? 'energie' : 'offreMobile');
    setFormData(mappedFormData);
    setShowForm(true);
    setSaleToView(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormType(null);
    setFormData({});
    setSaleToEdit(null);
  };

  /*** Création / modification vente ***/
  const handleSubmitSale = async (data) => {
    try {
      let response;
      if (saleToEdit) {
        response = await updateSale(saleToEdit.id, data);
        setSales(prev => prev.map(s => s.id === response.id ? response : s));
        toast.success("✅ Vente modifiée avec succès !");
        setSaleToEdit(null);
      } else {
        response = await createSale(data);
        setSales(prev => [response, ...prev]);
        toast.success("✅ Vente créée avec succès !");
      }
      handleCloseForm();
    } catch (error) {
      console.error(error);
      toast.error("❌ Erreur lors de l'enregistrement de la vente");
    }
  };

  /*** Suppression vente ***/
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
          await deleteSale(id);
          setSales(prev => prev.filter(s => s.id !== id));
          Swal.fire('Supprimé !', 'La vente a été supprimée avec succès.', 'success');
        } catch (error) {
          console.error(error);
          Swal.fire('Erreur', "Impossible de supprimer la vente.", 'error');
        }
      }
    });
  };

  /*** Mettre à jour le statut (admin seulement pour payer/annuler) ***/
  const handleUpdateStatus = async (saleId, newStatus) => {
    if (!isAdmin) return; // agents ne peuvent pas modifier le statut
    if (newStatus === 'cancelled') {
      const { value: motif } = await Swal.fire({
        title: 'Annuler la vente',
        input: 'text',
        inputLabel: 'Motif de l’annulation',
        inputPlaceholder: 'Ex: Client a changé d’avis',
        showCancelButton: true
      });
      if (!motif) return;
      try {
        await updateSale(saleId, { status: newStatus, motif });
        setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: newStatus, motif } : s));
        toast.success('✅ Vente annulée avec succès');
      } catch (error) {
        console.error(error);
        toast.error('❌ Impossible d’annuler la vente');
      }
    } else {
      try {
        await updateSale(saleId, { status: newStatus });
        setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: newStatus } : s));
        toast.success(`✅ Statut mis à jour : ${newStatus}`);
      } catch (error) {
        console.error(error);
        toast.error('❌ Impossible de mettre à jour le statut');
      }
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Default';
      case 'validated': return 'Payée';
      case 'cancelled': return 'Annulée';
      default: return status || 'Inconnu';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Historique des ventes</h2>
        <button
          onClick={handleOpenSelector}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle vente</span>
        </button>
      </div>

      <FiltreSalesList
        sales={sales}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onDeleteSale={handleDeleteSale}
        onUpdateStatus={handleUpdateStatus}
        onViewSale={setSaleToView}
        onEditSale={handleEditSale}
        isAdmin={isAdmin} // Filtrer boutons dans la liste selon rôle
        getStatusText={getStatusText}
      />

      <SaleDetailsModal
        sale={saleToView}
        onClose={() => setSaleToView(null)}
        onEdit={() => handleEditSale(saleToView)}
        getStatusText={getStatusText}
      />

      {showSelector && (
        <FormTypeSelector
          onSelect={handleSelectFormType}
          onClose={() => setShowSelector(false)}
        />
      )}

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
