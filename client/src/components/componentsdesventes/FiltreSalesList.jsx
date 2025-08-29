import React from 'react';
import { Eye, Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';
import { BadgeCheck, X as BadgeX } from 'lucide-react';
import Swal from 'sweetalert2';

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
  getStatusText,
  isAdmin,
  onRefresh,
  loading,
  onOpenNewSale, // 👈 bouton vient de VentesInfoPanel
}) => {
  // --- Filtrage par date
  const filterByDate = (saleDate) => {
    if (!saleDate) return false;
    const saleTime = new Date(saleDate).setHours(0, 0, 0, 0);
    const now = new Date();
    const today = new Date().setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        return saleTime === today;
      case 'week': {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay() + 1);
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);

        return saleTime >= firstDayOfWeek.getTime() && saleTime <= lastDayOfWeek.getTime();
      }
      case 'month': {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).setHours(0, 0, 0, 0);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).setHours(23, 59, 59, 999);
        return saleTime >= firstDayOfMonth && saleTime <= lastDayOfMonth;
      }
      case 'all':
      default:
        return true;
    }
  };

  // --- Format numéro
  const formatPhone = (phone) => {
    if (!phone) return '-';
    return phone.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  };

  // --- Filtrage global
  const filteredSales = sales.filter((sale) => {
    const searchFields = [
      sale.client_name || '',
      sale.client_firstname || '',
      sale.ref_client || '',
      sale.ref_contrat || '',
      sale.client_phone || '',
      sale.client_email || '',
      sale.ville_client || '',
      sale.adresse_client || '',
      sale.code_postal_client || '',
      sale.product_type || '',
      sale.nature_offre || '',
      sale.puissance_compteur || '',
      sale.partenaire || '',
      sale.etat_contrat || '',
      sale.status || '',
      sale.energie || '',
    ];

    const matchesSearch = searchFields.some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus =
      statusFilter === 'all' || sale.status === statusFilter || sale.etat_contrat === statusFilter;

    const matchesDate = filterByDate(sale.created_at);

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div>
      {/* --- Barre filtres --- */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-8">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Rechercher client, réf, tel, mail..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-3 pr-3 py-2 rounded-lg border border-gray-200 w-64"
        />

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="validated">Payées</option>
          <option value="cancelled">Annulées</option>
        </select>

        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Toutes les dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>
      </div>
      {/* --- Bouton à droite --- */}
        <button
          onClick={onOpenNewSale}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle vente</span>
        </button>
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

        {/* --- Tableau --- */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Réf. Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Réf. Contrat</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Téléphone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Statut</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Agent</th>
                )}
                <th className="px-6 py-3 text-center text-sm font-semibold text-blue-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-600 font-medium">
                    Chargement des ventes...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    Aucune vente trouvée avec ces critères
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-blue-50">
                    <td className="py-3 px-4 font-medium">{sale.ref_client || '-'}</td>
                    <td className="py-3 px-4 font-medium">{sale.ref_contrat || '-'}</td>
                    <td className="py-3 px-4">
                      {`${sale.civilite ? sale.civilite + ' ' : ''}${sale.client_name || ''} ${sale.client_firstname || ''}`.trim()}
                    </td>
                    <td className="py-3 px-4">{formatPhone(sale.client_phone)}</td>
                    <td className="py-3 px-4">
                      {sale.created_at ? new Date(sale.created_at).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="py-3 px-4">{getStatusText(sale.status)}</td>

                    {isAdmin && (
                      <td className="py-3 px-4">
                        {sale.agent_firstname && sale.agent_name
                          ? `${sale.agent_firstname} ${sale.agent_name}`
                          : "Inconnu"}
                      </td>
                    )}

                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2 items-center">
                        {/* Voir */}
                        <button
                          title="Voir"
                          type="button"
                          onClick={() => onViewSale && onViewSale(sale)}
                          className="px-3 py-1.5 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-transform hover:scale-105"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Modifier / Supprimer seulement si vente en attente */}
                        {(isAdmin || sale.status === "pending") && (
                          <>
                            <button
                              title="Modifier"
                              type="button"
                              onClick={onEditSale && (() => onEditSale(sale))}
                              className="px-3 py-1.5 rounded-lg border border-green-100 text-green-600 hover:bg-green-600 hover:text-white transition-transform hover:scale-105"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              title="Supprimer"
                              type="button"
                              onClick={() => onDeleteSale(sale.id)}
                              className="px-3 py-1.5 rounded-lg border border-yellow-100 text-yellow-600 hover:bg-yellow-600 hover:text-white transition-transform hover:scale-105"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Actions admin : marquer payée / annulée */}
                        {isAdmin && onUpdateStatus && (
                          <>
                            <button
                              className="px-3 py-1.5 rounded-lg border border-green-100 text-green-600 hover:bg-green-400 hover:text-white transition-transform hover:scale-105"
                              title="Marquer comme payée"
                              onClick={() => {
                                Swal.fire({
                                  title: 'Confirmer',
                                  text: 'Voulez-vous vraiment marquer cette vente comme payée ?',
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#22c55e',
                                  cancelButtonColor: '#ef4444',
                                  confirmButtonText: 'Oui, payer',
                                  cancelButtonText: 'Fermer'
                                }).then((result) => {
                                  if (result.isConfirmed) {
                                    onUpdateStatus(sale.id, "validated");
                                    Swal.fire('Payée !', 'La vente a été marquée comme payée.', 'success');
                                  }
                                });
                              }}
                            >
                              <BadgeCheck className="w-4 h-4" />
                            </button>

                            <button
                              className="px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-400 hover:text-white transition-transform hover:scale-105"
                              title="Annuler la vente"
                              onClick={async () => {
                                const { value: motif } = await Swal.fire({
                                  title: 'Annuler cette vente',
                                  input: 'textarea',
                                  inputPlaceholder: 'Motif de l’annulation...',
                                  text: 'Voulez-vous vraiment annuler cette vente ?',
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#22c55e',
                                  cancelButtonColor: '#ef4444',
                                  confirmButtonText: 'Oui, annuler',
                                  cancelButtonText: 'Fermer',
                                  inputValidator: (value) => {
                                    if (!value) return 'Vous devez renseigner un motif !';
                                  }
                                });

                                if (motif) {
                                  onUpdateStatus(sale.id, "cancelled", motif);
                                  Swal.fire('Annulée !', 'La vente a été annulée.', 'success');
                                }
                              }}
                            >
                              <BadgeX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FiltreSalesList;