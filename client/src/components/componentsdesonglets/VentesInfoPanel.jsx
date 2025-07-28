import React, { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import { Save, Send, X } from 'lucide-react';

// === Composant enfant : SalesForm ===
const SalesForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    service: '',
    amount: '',
    description: '',
    status: 'pending',
  });

  const services = [
    'Installation système sécurité',
    'Maintenance',
    'SAV',
    'Consultation',
    'Formation',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      service: '',
      amount: '',
      description: '',
      status: 'pending',
    });
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nouvelle vente</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer formulaire"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Les inputs comme dans ton code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du client *</label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner un service</option>
                {services.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant (€) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">En attente</option>
                <option value="validated">Validée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Détails de la vente..."
            />
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
              type="button"
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Brouillon</span>
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
      </div>
    </div>
  );
};

// === Composant parent : SalesList ===
const VentesInfoPanel = () => {
  const [sales, setSales] = useState([
    {
      id: '1',
      clientName: 'Sophie Martin',
      clientEmail: 'sophie.martin@email.com',
      clientPhone: '06 12 34 56 78',
      service: 'Installation système sécurité',
      amount: 2500,
      description: 'Installation complète système alarme maison',
      status: 'pending',
      createdAt: '2024-01-15',
      agent: 'Marie Dupont'
    },
    {
      id: '2',
      clientName: 'Jean Dubois',
      clientEmail: 'jean.dubois@email.com',
      clientPhone: '06 98 76 54 32',
      service: 'Maintenance',
      amount: 150,
      description: 'Maintenance annuelle système existant',
      status: 'validated',
      createdAt: '2024-01-14',
      agent: 'Marie Dupont'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmitSale = (formData) => {
    const newSale = {
      id: Date.now().toString(),
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      service: formData.service,
      amount: parseFloat(formData.amount),
      description: formData.description,
      status: formData.status,
      createdAt: new Date().toISOString().split('T')[0],
      agent: 'Marie Dupont'
    };
    setSales(prev => [newSale, ...prev]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'validated': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'validated': return 'Validée';
      case 'cancelled': return 'Annulée';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Historique des ventes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          type="button"
          aria-label="Nouvelle vente"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle vente</span>
        </button>
      </div>

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
                <th className="text-left py-3 px-4 font-medium text-gray-500">Service</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Montant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Statut</th>
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
                        <p className="font-medium text-gray-900">{sale.clientName}</p>
                        <p className="text-sm text-gray-500">{sale.clientEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{sale.service}</td>
                    <td className="py-3 px-4 font-medium">{sale.amount.toLocaleString()} €</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(sale.status)}`}
                      >
                        {getStatusText(sale.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{new Date(sale.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Voir" type="button">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Modifier" type="button">
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Supprimer" type="button">
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

      <SalesForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmitSale}
      />
    </div>
  );
};

export default VentesInfoPanel;
