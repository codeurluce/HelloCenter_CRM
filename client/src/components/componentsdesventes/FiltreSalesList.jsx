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
  getStatusText
}) => {
  // Filtrage simple (texte et statut)
  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      (sale.nomClient ? sale.nomClient.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
      (sale.prenomClient ? sale.prenomClient.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
      (sale.service || sale.energie || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || sale.status === statusFilter || sale.etatContrat === statusFilter;

    // TODO: Ajouter filtre date si besoin (dateFilter)

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher client, service..."
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
          <option value="pending">En attente</option>
          <option value="validated">Validées</option>
          <option value="cancelled">Annulées</option>
          <option value="CHF">CHF</option>
          <option value="MSV">MSV</option>
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

        <button
          className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          type="button"
          aria-label="Ouvrir filtres"
        >
          <Filter className="w-4 h-4" />
          <span>Filtres</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Client</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Partenaire/Service</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Montant / Etat</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length > 0 ? (
              filteredSales.map(sale => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{sale.nomClient} {sale.prenomClient || ''}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{sale.energie ? 'Énergie' : 'Offre Mobile'}</td>
                  <td className="py-3 px-4">
                    {sale.partenaire || sale.service || '-'}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {sale.amount ? `${sale.amount.toLocaleString()} €` : getStatusText(sale.etatContrat || sale.status)}
                  </td>
                  <td className="py-3 px-4">{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Voir" type="button">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Modifier" type="button">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Supprimer"
                        type="button"
                        onClick={() => {
                          if (window.confirm('Confirmer la suppression ?')) {
                            onDeleteSale(sale.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-500">
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
