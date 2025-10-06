import React, { useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Plus,
  Upload,
  Headphones,
  FileText
} from "lucide-react";
import { BadgeCheck, X as BadgeX } from "lucide-react";
import Swal from "sweetalert2";
import ExportModal from "../componentsAdminVentes/ExportModalVentes";
import HistoriqueVentesModal from "../componentsAdminVentes/HistoriqueVentesModal.tsx"

const FiltreSalesList = ({
  sales,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  onDeleteSale,
  onViewSale,
  onEditSale,
  onUpdateStatus,
  onAuditeSale,
  getStatusText,
  isAdmin,
  isManager,
  isAdminOrManager,
  onRefresh,
  loading,
  onOpenNewSale,
  univers,
}) => {
  const [showExport, setShowExport] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (id) => {
    setSelectedSaleId(id);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const filterByDate = (saleDate) => {
    if (!saleDate) return false;
    const saleTime = new Date(saleDate).setHours(0, 0, 0, 0);
    const now = new Date();
    const today = new Date().setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case "today":
        return saleTime === today;
      case "week": {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay() + 1);
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);

        return (
          saleTime >= firstDayOfWeek.getTime() &&
          saleTime <= lastDayOfWeek.getTime()
        );
      }
      case "month": {
        const firstDayOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).setHours(0, 0, 0, 0);
        const lastDayOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        ).setHours(23, 59, 59, 999);
        return saleTime >= firstDayOfMonth && saleTime <= lastDayOfMonth;
      }
      case "all":
      default:
        return true;
    }
  };

  const filteredSales = sales.filter((sale) => {
    const searchFields = [
      sale.client_name || "",
      sale.client_firstname || "",
      sale.ref_client || "",
      sale.ref_contrat || "",
      sale.client_phone || "",
      sale.client_email || "",
      sale.ville_client || "",
      sale.adresse_client || "",
      sale.code_postal_client || "",
      sale.product_type || "",
      sale.nature_offre || "",
      sale.puissance_compteur || "",
      sale.partenaire || "",
      sale.etat_contrat || "",
      sale.status || "",
      sale.energie || "",
      sale.free_agent_account || "",
      sale.ancien_operateur || "",
      sale.type_technologie || "",
      sale.prix_offre || "",
      sale.provenance_fichier || "",
      sale.iban || "",
      sale.rio || "",
      sale.ref_cmd || "",
      sale.etat_cmd || "",
    ];
    const matchesSearch = searchFields.some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus =
      statusFilter === "all" ||
      sale.status === statusFilter ||
      sale.etat_contrat === statusFilter;

    const matchesDate = filterByDate(sale.created_at);

    return matchesSearch && matchesStatus && matchesDate;
  });

  console.log("univers dans FiltreSalesList:", univers);

  return (
    <div>
      {/* Barre filtres */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Rechercher client, réf, tel, mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 pr-3 py-2 rounded-lg border border-gray-200 w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="validated">Payées</option>
            <option value="cancelled">Annulées</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>

        {/* Bouton Nouvelle Vente */}
        <div className="flex-1" />
        <button
          onClick={onOpenNewSale}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 space-x-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle vente</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 gap-2 rounded-lg transition-colors font-medium shadow-sm"
          >
            <Upload size={16} /> Exporter
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <div className="flex justify-between items-center p-3 border-b bg-gray-50">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 py-1 px-3 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition"
          >
            <RefreshCw size={16} /> Rafraîchir
          </button>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Chargement des ventes...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucune vente trouvée
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
              <table className="w-full border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    {/* Colonnes selon univers */}
                    {!isAdmin && univers === "Energie" && (
                      <>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                          Réf. Client
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                          Réf. Contrat
                        </th>
                      </>
                    )}

                    {!isAdminOrManager && univers === "OffreMobile" && (
                      <>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                          Réf. CMD
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                          État CMD
                        </th>
                      </>
                    )}

                    {/* Colonnes Admin */}
                    {isAdminOrManager && (
                      <>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                          Type de vente
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                          Référence
                        </th>
                      </>
                    )}

                    {/* Colonnes communes */}
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                      Statut
                    </th>
                    {isAdminOrManager && (
                      <>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                          Agent
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                          Auditer
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 text-center text-sm font-semibold text-blue-700">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-gray-100 hover:bg-blue-50"
                    >
                      {/* Colonnes selon univers */}
                      {!isAdminOrManager && univers === "Energie" && (
                        <>
                          <td className="py-3 px-4 font-medium">
                            {sale.ref_client || "-"}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {sale.ref_contrat || "-"}
                          </td>
                        </>
                      )}

                      {!isAdminOrManager && univers === "OffreMobile" && (
                        <>
                          <td className="py-3 px-4 font-medium">
                            {sale.ref_cmd || "-"}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {sale.etat_cmd || "-"}
                          </td>
                        </>
                      )}

                      {/* Colonnes Admin */}
                      {isAdminOrManager && (
                        <>
                          <td className="py-3 px-4 font-medium">{sale.product_type || "-"}</td>
                          <td className="py-3 px-4 font-medium">
                            {sale.ref_client || sale.ref_cmd || sale.ref_contrat || "-"}
                          </td>
                        </>
                      )}

                      {/* Colonnes communes */}
                      <td className="py-3 px-4">
                        {`${sale.civilite ? sale.civilite + " " : ""}${sale.client_name || ""
                          } ${sale.client_firstname || ""}`.trim()}
                      </td>
                      <td className="py-3 px-4">
                        {sale.created_at
                          ? new Date(sale.created_at).toLocaleDateString("fr-FR")
                          : "-"}
                      </td>
                      <td className="py-3 px-4">{getStatusText(sale.status)}</td>
                      {isAdminOrManager && (
                        <td className="py-3 px-4">
                          {sale.agent_firstname && sale.agent_name
                            ? `${sale.agent_firstname} ${sale.agent_name}`
                            : "Inconnu"}
                        </td>
                      )}
                      {isAdminOrManager && (
                        <td className="py-3 px-4 text-center items-center">
                          {sale.audite ? "0ui" : "Non"}
                        </td>
                      )}
                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2 items-center">
                          {/* Voir */}
                          <div className="relative group">
                            <button
                              title=""
                              type="button"
                              onClick={() => {
                                if (!onViewSale) return;

                                // Condition selon le type de vente
                                if (sale.product_type === "energie") {
                                  onViewSale(sale, "energie"); // tu passes un paramètre pour savoir quel modal ouvrir
                                } else if (sale.product_type === "offreMobile") {
                                  onViewSale(sale, "offremobile");
                                } else {
                                  console.warn("Type de vente inconnu :", sale.product_type);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-transform hover:scale-105"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-blue-600 text-white text-xs whitespace-nowrap">
                              Détails Vente
                            </span>
                          </div>

                          {/* Modifier / Supprimer seulement si vente en attente */}
                          {(isAdminOrManager) && (

                            <div className="relative group">
                              <button
                                title=""
                                type="button"
                                onClick={onEditSale && (() => onEditSale(sale))}
                                className="px-3 py-1.5 rounded-lg border border-green-100 text-green-600 hover:bg-green-600 hover:text-white transition-transform hover:scale-105"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-green-600 text-white text-xs whitespace-nowrap">
                                Modifier
                              </span>
                            </div>
                          )}
                          {/* Bouton Supprimer → visible uniquement pour Admin */}
                          {isAdmin && (

                            <div className="relative group">
                              <button
                                title="Supprimer"
                                type="button"
                                onClick={() => onDeleteSale(sale.id)}
                                className="px-3 py-1.5 rounded-lg border border-yellow-100 text-yellow-600 hover:bg-yellow-600 hover:text-white transition-transform hover:scale-105"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-yellow-600 text-white text-xs whitespace-nowrap">
                                Supprimer
                              </span>
                            </div>

                          )}

                          {/* Actions admin */}
                          {isAdminOrManager && onUpdateStatus && (
                            <>
                              <div className="relative group">
                                <button
                                  className="px-3 py-1.5 rounded-lg border border-green-100 text-green-600 hover:bg-green-400 hover:text-white transition-transform hover:scale-105"
                                  title=""
                                  onClick={() => {
                                    Swal.fire({
                                      title: "Payer cette vente",
                                      text:
                                        "Voulez-vous marquer cette vente comme payée ?",
                                      icon: "warning",
                                      showCancelButton: true,
                                      confirmButtonColor: "#22c55e",
                                      cancelButtonColor: "#9ca3af",
                                      confirmButtonText: "Oui, payer",
                                      cancelButtonText: "Fermer",
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        onUpdateStatus(sale.id, "validated");
                                        Swal.fire(
                                          "Payée !",
                                          "La vente a été marquée comme payée.",
                                          "success"
                                        );
                                      }
                                    });
                                  }}
                                >
                                  <BadgeCheck className="w-4 h-4" />
                                </button>
                                <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-green-400 text-white text-xs whitespace-nowrap">
                                  Payer la vente
                                </span>
                              </div>

                              <div className="relative group">
                                <button
                                  className="px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-400 hover:text-white transition-transform hover:scale-105"
                                  title=""
                                  onClick={async () => {
                                    const { value: motif } = await Swal.fire({
                                      title: "Annuler cette vente",
                                      input: "textarea",
                                      inputPlaceholder: "Saisissez le motif de l’annulation...",
                                      text: "Voulez-vous vraiment annuler cette vente ?",
                                      icon: "warning",
                                      showCancelButton: true,
                                      confirmButtonColor: "#22c55e",
                                      cancelButtonColor: "#9ca3af",
                                      confirmButtonText: "Oui, annuler",
                                      cancelButtonText: "Fermer",
                                      inputValidator: (value) => {
                                        if (!value) return "Vous devez renseigner un motif !";
                                      },
                                    });

                                    if (motif) {
                                      onUpdateStatus(sale.id, "cancelled", motif);
                                      Swal.fire(
                                        "Annulée !",
                                        "La vente a été annulée.",
                                        "success"
                                      );
                                    }
                                  }}
                                >
                                  <BadgeX className="w-4 h-4" />
                                </button>
                                <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-red-400 text-white text-xs whitespace-nowrap">
                                  Annuler la vente
                                </span>
                              </div>


                              <div className="relative group">
                                <button
                                  className="px-3 py-1.5 rounded-lg border border-gray-100 text-black-600 hover:bg-gray-900 hover:text-white transition-transform hover:scale-105"
                                  title=""
                                  onClick={() => {
                                    Swal.fire({
                                      title: "Auditer cette vente",
                                      text:
                                        "Voulez-vous marquer cette vente comme auditée ?",
                                      icon: "warning",
                                      showCancelButton: true,
                                      confirmButtonColor: "#22c55e",
                                      cancelButtonColor: "#9ca3af",
                                      confirmButtonText: "Oui, auditer",
                                      cancelButtonText: "Fermer",
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        onAuditeSale(sale.id, "true");
                                        Swal.fire(
                                          "Auditée !",
                                          "La vente a été marquée comme auditée.",
                                          "success"
                                        );
                                      }
                                    });
                                  }}
                                >
                                  <Headphones className="w-4 h-4" />
                                </button>
                                <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-gray-900 text-white text-xs whitespace-nowrap">
                                  Auditer
                                </span>
                              </div>

                              <div className="relative group">
                                <button
                                  onClick={() => openModal(sale.id)}
                                  title=""
                                  className=" px-3 py-1.5 rounded-lg border border-green-100 text-blue-600 hover:bg-blue-600 hover:text-white
                                                                                                              transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-105">
                                  <FileText className="w-4 h-4" />
                                </button>
                                <span className="pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-blue-600 text-white text-xs whitespace-nowrap">
                                  Voir l'historique
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <HistoriqueVentesModal
        isOpen={modalOpen}
        saleId={selectedSaleId}
        onClose={closeModal}
      />

      {showExport && (
        <ExportModal
          isOpen={showExport}
          sales={filteredSales}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default FiltreSalesList;
