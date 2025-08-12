import React from 'react';
import { Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';

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
  getStatusText
}) => {

  // Filtrage par date
  const filterByDate = (saleDate) => {
    if (!saleDate) return false;
    const saleTime = new Date(saleDate).setHours(0,0,0,0);
    const now = new Date();
    const today = new Date().setHours(0,0,0,0);

    switch (dateFilter) {
      case 'today':
        return saleTime === today;
      case 'week': {
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)).setHours(0,0,0,0);
        const lastDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 7)).setHours(23,59,59,999);
        return saleTime >= firstDayOfWeek && saleTime <= lastDayOfWeek;
      }
      case 'month': {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).setHours(0,0,0,0);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).setHours(23,59,59,999);
        return saleTime >= firstDayOfMonth && saleTime <= lastDayOfMonth;
      }
      case 'all':
      default:
        return true;
    }
  };

  // Format numéro de téléphone
  const formatPhone = (phone) => {
    if (!phone) return '-';
    return phone.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  };

  // Filtrage global
  const filteredSales = sales.filter(sale => {
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
      sale.energie || ''
      ];

    const matchesSearch = searchFields.some(field =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus =
      statusFilter === 'all' || sale.status === statusFilter || sale.etat_contrat === statusFilter;

    const matchesDate = filterByDate(sale.created_at);

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Barre de filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher client, réf..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Recherche ventes"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Filtre statut"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">Default</option>
          <option value="validated">Payées</option>
          <option value="cancelled">Annulées</option>
        
        </select>

        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Filtre date"
        >
          <option value="all">Toutes les dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>

        {/* <button
          className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          type="button"
          aria-label="Ouvrir filtres"
        >
          <Filter className="w-4 h-4" />
          <span>Filtres</span>
        </button> */}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Réf. Client</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Réf. Contrat</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Client</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Téléphone</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Statut</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length > 0 ? (
              filteredSales.map(sale => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors" 
                              title="Voir" 
                              type="button"  
                              onClick={() => onViewSale && onViewSale(sale)}>
                              <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors" 
                              title="Modifier" 
                              type="button"
                              onClick={onEditSale && (() => onEditSale(sale))}>
                              <Edit className="w-4 h-4 text-gray-500" />
                      </button>

                      <button
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Supprimer"
                        type="button"
                        onClick={() => onDeleteSale(sale.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-12 text-gray-500">
                  Aucune vente trouvée avec ces critères
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FiltreSalesList;
