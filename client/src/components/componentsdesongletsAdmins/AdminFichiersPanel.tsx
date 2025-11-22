import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
  Upload,
  UserPlus,
  FileText,
  Search,
  Download,
  RefreshCw,
  Trash2Icon,
  Repeat,
} from 'lucide-react';
import { Fiche, ClotureData } from '../componentsAdminFiches/fiche.ts';
import { FichesTable } from '../componentsAdminFiches/FichesTable.tsx';
import ImportModal from '../componentsAdminFiches/ImportModal.tsx';
import AssignModal from '../componentsAdminFiches/AssignModal.tsx';
import ExportModalFiches from '../componentsAdminFiches/ExportMadalFiches.tsx';
import { AuthContext } from '../../pages/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import HistoriqueFilesModal from '../componentsAdminFiches/HistoriqueFilesModal.tsx';
import DetailModal from '../componentsAdminFiches/DetailModal.tsx';
import Swal from 'sweetalert2';

// ✅ On garde le type ici pour l’exporter si besoin ailleurs
export type AdminFilterType = 'nouvelles' | 'assignees' | 'en_cours' | 'rendez_vous' | 'cloturees' | 'toutes';

interface AdminFichiersPanelProps {
  agents: Array<{ id: number; name: string; email: string }>;
  onTreatFiche: (id: number) => void;
  onCancelFiche: (id: number) => void;
  onCloseFiche: (id: number, data: ClotureData) => void;
  onProgramRdv: (id: number, date: string, commentaire: string) => void;
  onImportFiches: (fiches: Partial<Fiche>[]) => void;
  onDeleteFiche: (id: number) => void;
  onRefresh?: () => void;
}

const AdminFichiersPanel: React.FC<AdminFichiersPanelProps> = ({
  agents,
  onTreatFiche,
  onCancelFiche,
  onCloseFiche,
  onProgramRdv,
  onDeleteFiche,
  onRefresh,
}) => {
  const { user } = useContext(AuthContext);
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAgentTerm, setSearchAgentTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFiches, setSelectedFiches] = useState<number[]>([]);
  const [selectedFiche, setSelectedFiche] = useState<Fiche | null>(null);
  const [batchSize, setBatchSize] = useState<number | ''>('');
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    ficheId: number | null;
    currentAgentId: number | null;
  }>({ isOpen: false, ficheId: null, currentAgentId: null });
  const [showExportModal, setShowExportModal] = useState(false);
  const [historiqueModal, setHistoriqueModal] = useState({
    isOpen: false,
    ficheId: null as number | null,
  });
  const [modalOpen, setModalOpen] = useState(false);

  // Onglets univers
  const tabs = [
    { key: 'Energie', label: 'Énergie' },
    { key: 'OffreMobile', label: 'Box Internet' },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [tabFilters, setTabFilters] = useState<{ [key: string]: AdminFilterType }>({
    Energie: 'nouvelles',
    OffreMobile: 'nouvelles',
  });
  const activeFilter = tabFilters[activeTab];

  // Fetch fiches
  const fetchFiches = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/files/all_files');
      setFiches(response.data);
    } catch (error: any) {
      console.error('Erreur fetch fiches:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiches();
  }, []);

  const openDetailModal = (fiche: Fiche) => {
    setSelectedFiche(fiche);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedFiche(null);
  };

  // Assign modal
  const handleAssignFiche = (ficheId: number, currentAgentId?: number | null) => {
    setAssignModal({ isOpen: true, ficheId, currentAgentId: currentAgentId ?? null });
  };

  // Supprimer une fiche
  const handleDeleteFiche = async (ficheId: number) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmer suppression',
      text: 'Voulez-vous vraiment supprimer cette fiche ?',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#2563eb',
    });

    if (result.isConfirmed) {
      try {
        const res = await axiosInstance.delete(`/files/${ficheId}/delete`);
        Swal.fire('Supprimé !', res.data.message, 'success');
        setFiches((prev) => prev.filter((f) => f.id !== ficheId));
      } catch (err: any) {
        console.error(err);
        Swal.fire('Erreur', err.response?.data?.error || 'Erreur serveur', 'error');
      }
    }
  };

  // Retirer l'assignation d'une fiche
  const handleUnassignFiche = async (fiche: Fiche) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Retirer l\'assignation',
      text: `Voulez-vous retirer la fiche assignée à ${fiche.assigned_to_name || 'cet agent'} ?`,
      showCancelButton: true,
      confirmButtonText: 'Oui, retirer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#6d28d9',
      cancelButtonColor: '#dc2626',
    });

    if (result.isConfirmed) {
      try {
        const res = await axiosInstance.put('/files/unassign', { ficheIds: [fiche.id] });
        Swal.fire('Désassignée !', res.data.message, 'success');
        setFiches((prev) => prev.filter((f) => f.id !== fiche.id));
      } catch (err: any) {
        console.error(err);
        Swal.fire('Erreur', err.response?.data?.error || 'Erreur serveur', 'error');
      }
    }
  };

  // Retirer l'assignation de plusieurs fiches
  const handleBatchUnassign = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Confirmer désassignation',
      text: `Voulez-vous vraiment désassigner ${selectedFiches.length} fiche(s) ?`,
      showCancelButton: true,
      confirmButtonText: 'Oui, retirer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#6d28d9',
      cancelButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      const ids = selectedFiches;
      const res = await axiosInstance.put('/files/unassign', { ficheIds: ids });
      Swal.fire('Succès', res.data.message, 'success');

      setFiches((prev) =>
        prev.map((f) => (ids.includes(f.id) ? { ...f, agent_id: null, agent_name: null } : f))
      );
      setSelectedFiches([]);
    } catch (e: any) {
      Swal.fire('Erreur', e.response?.data?.error || 'Erreur serveur', 'error');
    }
  };

  // Supprimer un lot de fichiers
  const handleBatchDelete = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmer suppression',
      text: `Voulez-vous vraiment supprimer ${selectedFiches.length} fiche(s) ?`,
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#2563eb',
    });

    if (!result.isConfirmed) return;

    try {
      const ids = selectedFiches;
      const res = await axiosInstance.delete('/files/delete-batch', {
        data: { ficheIds: ids },
      });
      Swal.fire('Supprimées', res.data.message, 'success');
      setFiches((prev) => prev.filter((f) => !ids.includes(f.id)));
      setSelectedFiches([]);
    } catch (e: any) {
      Swal.fire('Erreur', e.response?.data?.error || 'Erreur serveur', 'error');
    }
  };

  const handleAssignSubmit = async (agentId: number) => {
    try {
      const ficheIds = assignModal.ficheId ? [assignModal.ficheId] : selectedFiches;
      const res = await axiosInstance.put('/files/assigned_To', { ficheIds, agentId });

      setFiches((prev) =>
        prev.map((f) =>
          ficheIds.includes(f.id) ? { ...f, assigned_to: agentId, statut: 'nouvelle' } : f
        )
      );

      setSelectedFiches((prev) => prev.filter((id) => !ficheIds.includes(id)));
      setAssignModal({ isOpen: false, ficheId: null, currentAgentId: null });
      return res.data;
    } catch (err: any) {
      console.error('Erreur assignation:', err.response?.data || err.message);
      throw err;
    }
  };

  const onImportFiches = async (importedData: any) => {
    try {
      const response = await axiosInstance.put('/files/import_files', {
        files: importedData,
      });

      const result = response.data;
      setFiches((prev) => [...prev, ...result.addedFiches]);
      return result;
    } catch (error: any) {
      console.error('❌ Erreur import:', error.response?.data || error.message);
      throw error;
    }
  };

  // Filtrage fiches
  const filteredFiches = useMemo(() => {
    let result = fiches.filter((f) => f.univers === activeTab);
    switch (activeFilter) {
      case 'nouvelles':
        result = result.filter((f) => f.statut === 'nouvelle' && !f.assigned_to);
        break;
      case 'assignees':
        result = result.filter((f) => f.statut === 'nouvelle' && f.assigned_to);
        break;
      case 'en_cours':
        result = result.filter((f) => f.statut === 'en_traitement');
        break;
      case 'rendez_vous':
        result = result.filter((f) => f.statut === 'rendez_vous');
        break;
      case 'cloturees':
        result = result.filter((f) => f.statut === 'cloturee');
        break;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.nom_client.toLowerCase().includes(term) ||
          f.prenom_client.toLowerCase().includes(term) ||
          (f.numero_mobile || '').includes(term) ||
          (f.numero_fixe || '').includes(term) ||
          (f.mail_client || '').toLowerCase().includes(term) ||
          (f.ville_client || '').toLowerCase().includes(term) ||
          (f.univers || '').toLowerCase().includes(term) ||
          f.id.toString().includes(term)
      );
    }

    if (searchAgentTerm) {
      const agentTerm = searchAgentTerm.toLowerCase();
      result = result.filter((f) =>
        (f.assigned_to_name || '').toLowerCase().includes(agentTerm)
      );
    }

    return result;
  }, [fiches, activeFilter, activeTab, searchTerm, searchAgentTerm]);

  // Compteurs
  const counters = useMemo(() => {
    const fichesByUnivers = fiches.filter((f) => f.univers === activeTab);
    return {
      nouvelles: fichesByUnivers.filter((f) => f.statut === 'nouvelle' && !f.assigned_to).length,
      assignees: fichesByUnivers.filter((f) => f.statut === 'nouvelle' && f.assigned_to).length,
      en_cours: fichesByUnivers.filter((f) => f.statut === 'en_traitement').length,
      rendez_vous: fichesByUnivers.filter((f) => f.statut === 'rendez_vous').length,
      cloturees: fichesByUnivers.filter((f) => f.statut === 'cloturee').length,
      toutes: fichesByUnivers.length,
    };
  }, [fiches, activeTab]);

  // Batch select
  const handleBatchSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setBatchSize(isNaN(value) ? '' : value);
    if (!isNaN(value)) setSelectedFiches(filteredFiches.slice(0, value).map((f) => f.id));
    else setSelectedFiches([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">Administration des Fiches</h2>
            <p className="text-gray-600">Gestion complète et assignation aux agents</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="nom client, téléphone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
              />
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <Download size={18} /> Importer
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              <Upload size={18} /> Exporter
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex space-x-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 rounded-t-xl font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-md border border-b-0 border-gray-200'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Fiches */}
        <div className="bg-white shadow-md rounded-b-xl border border-gray-200 p-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            {(['nouvelles', 'assignees', 'en_cours', 'rendez_vous', 'cloturees', 'toutes'] as AdminFilterType[]).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setTabFilters((prev) => ({ ...prev, [activeTab]: f }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeFilter === f
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f}{' '}
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                    {counters[f]}
                  </span>
                </button>
              )
            )}
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Filtre par agent..."
                value={searchAgentTerm}
                onChange={(e) => setSearchAgentTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            <button
              onClick={() => fetchFiches()}
              className="flex ml-6 items-center gap-2 py-1 px-3 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition ml-auto"
            >
              <RefreshCw size={16} /> Rafraîchir
            </button>
          </div>

          {/* Batch select */}
          <div className="flex items-center gap-3 mb-4">
            <label>Nombre de fiches :</label>
            <select
              value={batchSize}
              onChange={handleBatchSizeChange}
              className="px-2 py-1 border rounded"
            >
              <option value="">-- Choisir --</option>
              {[5, 10, 20, 30, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            {selectedFiches.length > 0 && (
              <>
                <button
                  onClick={() =>
                    setAssignModal({ isOpen: true, ficheId: null, currentAgentId: null })
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  <UserPlus size={18} /> Assigner {selectedFiches.length} fiches
                </button>

                <div className="flex items-center gap-3 ml-auto">
                  {activeFilter !== 'nouvelles' && (
                    <button
                      onClick={handleBatchUnassign}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow"
                    >
                      <Repeat size={18} />
                      Retirer {selectedFiches.length} fiche(s)
                    </button>
                  )}

                  <button
                    onClick={handleBatchDelete}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow"
                  >
                    <Trash2Icon size={18} />
                    Supprimer {selectedFiches.length} fiche(s)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des fiches...</p>
              </div>
            ) : filteredFiches.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Aucune fiche trouvée</div>
            ) : (
              <div className="border border-gray-300 rounded-t-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700 whitespace-nowrap">
                        N° fiche
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700 whitespace-nowrap">
                        Numéro mobile
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                        Assignée à
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700 whitespace-nowrap">
                        Date import
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-blue-700">
                        Actions
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedFiches(filteredFiches.map((f) => f.id));
                            else setSelectedFiches([]);
                          }}
                          checked={
                            selectedFiches.length === filteredFiches.length && filteredFiches.length > 0
                          }
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiches.map((fiche) => (
                      <FichesTable
                        key={fiche.id}
                        fiche={fiche}
                        activeFilter={activeFilter}
                        selectedFiches={selectedFiches}
                        onAssign={handleAssignFiche}
                        onDelete={handleDeleteFiche}
                        onUnassign={handleUnassignFiche}
                        onOpenDetail={openDetailModal}
                        onOpenHistorique={(id) => setHistoriqueModal({ isOpen: true, ficheId: id })}
                        toggleSelect={(id, checked) => {
                          if (checked) setSelectedFiches((prev) => [...prev, id]);
                          else setSelectedFiches((prev) => prev.filter((i) => i !== id));
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={onImportFiches}
        />

        <AssignModal
          isOpen={assignModal.isOpen}
          onClose={() =>
            setAssignModal({ isOpen: false, ficheId: null, currentAgentId: null })
          }
          onAssign={handleAssignSubmit}
          agents={agents}
          currentAgentId={assignModal.currentAgentId}
          ficheId={assignModal.ficheId}
          selectedFiches={selectedFiches}
        />

        <ExportModalFiches
          isOpen={showExportModal}
          fiches={fiches}
          onClose={() => setShowExportModal(false)}
        />

        <HistoriqueFilesModal
          isOpen={historiqueModal.isOpen}
          ficheId={historiqueModal.ficheId}
          onClose={() => setHistoriqueModal({ isOpen: false, ficheId: null })}
        />

        {selectedFiche && (
          <DetailModal isOpen={modalOpen} onClose={closeModal} fiche={selectedFiche} />
        )}
      </div>
    </div>
  );
};

export default AdminFichiersPanel;