import React, { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

import SalesFormEnergie from "../componentsdesventes/SalesFormEnergie";
import SalesFormOffreMobile from "../componentsdesventes/SalesFormOffreMobile";
import FormTypeSelector from "../componentsdesventes/FormTypeSelector";
import FiltreSalesList from "../componentsdesventes/FiltreSalesList";
import SaleDetailsModal from "../componentsdesventes/SaleDetailsModal";
import { deleteSale, updateSale, createSale } from "../../api/salesActions";
import axiosInstance from "../../api/axiosInstance";
import SaleDetailsModalOffreMobile from "../componentsdesventes/SaleDetailsModalOffreMobile";


const VentesInfoPanel = ({ agentId }) => {
  // Lecture hors React des valeurs dans localStorage pour initialisation immédiate
  const role = localStorage.getItem("role");
  const isAdminRole = role === "Admin";
  const isAdmin = localStorage.getItem("role") === "Admin";

  // États avec valeurs initiales calculées hors React
  const [univers, setUnivers] = useState(null);
  const [sales, setSales] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [saleToEdit, setSaleToEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connectedAgent, setConnectedAgent] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [modalType, setModalType] = useState(null);


  useEffect(() => {
  const storedAgent = localStorage.getItem("user");
  if (storedAgent) {
    const parsedAgent = JSON.parse(storedAgent);
    setConnectedAgent(parsedAgent);
    setUnivers(parsedAgent.univers || null); // 🔑 récup univers
  }
}, []);

// Charger les ventes une fois l'agent connu
useEffect(() => {
  if (connectedAgent) {
    fetchSales();
  }
}, [connectedAgent]);

  // Charger les ventes au montage
  const fetchSales = async () => {
    setLoading(true);
    try {
      const endpoint = isAdminRole ? "/sales/admin" : "/sales";
      const response = await axiosInstance.get(endpoint);
      setSales([...response.data]);
    } catch (error) {
      console.error("Erreur chargement ventes:", error);
      toast.error("Impossible de récupérer les ventes");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSale = (sale, type) => {
  setSelectedSale(sale);
  setModalType(type);
};

  // Sélecteur de type de formulaire
  const handleOpenSelector = () => setShowSelector(true);
  const handleSelectFormType = (type) => {
    setFormType(type);
    setFormData({ product_type: type });
    setShowSelector(false);
    setShowForm(true);
  };

  // Edition d’une vente
  const handleEditSale = (sale) => {
    const mappedFormData = {
      partenaire: sale.partenaire,
      civilite: sale.civilite,
      nomClient: sale.client_name || "",
      prenomClient: sale.client_firstname || "",
      emailClient: sale.client_email || "",
      numMobile: sale.client_phone || "",
      numFixe: sale.client_phone_fix || "",
      villeClient: sale.ville_client || "",
      adresseClient: sale.adresse_client || "",
      codePostal: sale.code_postal_client || "",
      refClient: sale.ref_client || "",
      refContrat: sale.ref_contrat || "",
      energie: sale.energie || "",
      pdl: sale.pdl || "",
      pce: sale.pce || "",
      natureOffre: sale.nature_offre || "",
      puissanceCompteur: sale.puissance_compteur || "",
      etatContrat: sale.etat_contrat || "",
      fichier: sale.fichier || null,

      // Champs Offre Mobile
      free_agent_account: sale.free_agent_account || "",
      ancienOperateur: sale.ancien_operateur || "",
      pto: sale.pto || "",
      optionSmartphone: sale.option_smartphone || "",
      autresOptions: sale.autres_options || "",
      engagement: sale.engagement,
      typeTechnologie: sale.type_technologie || "",
      prixOffre: sale.prix_offre || "",
      provenanceFichier: sale.provenance_fichier || "",
      iban: sale.iban || "",
      rio: sale.rio || "",
      etat_cmd: sale.etat_cmd || "",
      ref_cmd: sale.ref_cmd || "",
    };
    setSaleToEdit(sale);
    setFormType(sale.product_type?.toLowerCase() === "energie" ? "energie" : "offreMobile");
    setFormData(mappedFormData);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormType(null);
    setFormData({});
    setSaleToEdit(null);
  };

  // Création / modification
  const handleSubmitSale = async (data) => {
    try {
      let response;
      if (saleToEdit) {
        response = await updateSale(saleToEdit.id, data);
        setSales((prev) =>
          prev.map((s) => (s.id === response.id ? response : s))
        );
        toast.success("✅ Vente modifiée avec succès !");
        setSaleToEdit(null);
      } else {
        response = await createSale(data);
        setSales((prev) => [response, ...prev]);
        toast.success("✅ Vente créée avec succès !");
      }
      handleCloseForm();
    } catch (error) {
      console.error(error);
      toast.error("❌ Erreur lors de l'enregistrement de la vente");
    }
  };

  // Suppression
  const handleDeleteSale = async (id) => {
    const result = await Swal.fire({
      title: "Supprimer la vente ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await deleteSale(id);
        setSales((prev) => prev.filter((s) => s.id !== id));
        Swal.fire("Supprimé !", "La vente a été supprimée.", "success");
      } catch (error) {
        console.error(error);
        Swal.fire("Erreur", "Impossible de supprimer la vente.", "error");
      }
    }
  };

  // Mise à jour statut (admin)
  const handleUpdateStatus = async (saleId, newStatus, motif = null) => {
    if (!isAdmin) return;

    if (newStatus === "cancelled" && !motif) {
      const { value } = await Swal.fire({
        title: "Annuler la vente",
        input: "textarea",
        inputLabel: "Motif de l’annulation",
        inputPlaceholder: "Ex: Client a changé d’avis",
        showCancelButton: true,
        confirmButtonText: "Oui, annuler",
        cancelButtonText: "Fermer",
        inputValidator: (value) => !value && "Vous devez renseigner un motif !",
      });
      if (!value) return;
      motif = value;
    }

    try {
      const response = await axiosInstance.put(`/sales/${saleId}/change-status`, {
        status: newStatus,
        motif,
      });

      setSales((prev) =>
        prev.map((s) => (s.id === saleId ? response.data : s))
      );

      toast.success(
        newStatus === "cancelled"
          ? "✅ Vente annulée avec succès"
          : "✅ Statut mis à jour"
      );
    } catch (error) {
      console.error(error);
      toast.error("❌ Impossible de mettre à jour le statut");
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Default";
      case "validated":
        return "Payée";
      case "cancelled":
        return "Annulée";
      default:
        return status || "Inconnu";
    }
  };
console.log("Univers détecté:", univers);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Historique des ventes
      </h2>
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
        onViewSale={handleViewSale}
        onEditSale={handleEditSale}
        isAdmin={isAdmin}
        getStatusText={getStatusText}
        onRefresh={fetchSales}
        loading={loading}
        onOpenNewSale={handleOpenSelector}
        univers={univers}
      />

      {selectedSale && modalType === "energie" && (
  <SaleDetailsModal
    sale={selectedSale}
    onClose={() => setSelectedSale(null)}
    onEdit={() => handleEditSale(selectedSale)}
    getStatusText={getStatusText}
    isAdmin={isAdmin}
  />
)}

{selectedSale && modalType === "offremobile" && (
  <SaleDetailsModalOffreMobile
    sale={selectedSale}
    onClose={() => setSelectedSale(null)}
    onEdit={() => handleEditSale(selectedSale)}
    getStatusText={getStatusText}
    isAdmin={isAdmin}
  />
)}
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
                {formType === "energie"
                  ? "Nouvelle vente - Énergie"
                  : "Nouvelle vente - Offre Mobile"}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formType === "energie" ? (
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
