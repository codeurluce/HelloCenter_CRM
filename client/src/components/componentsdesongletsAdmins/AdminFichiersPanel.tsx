// src/components/componentsdesongletsAdmins/AdminFichiersPanel.tsx
import React, { useState, useMemo, useEffect, useContext } from 'react';
import { Fiche, ClotureData } from '../componentsAdminFiches/fiche.ts';
import { FichesTable } from '../componentsAdminFiches/FichesTable.tsx';
import ImportModal from '../componentsAdminFiches/ImportModal.tsx';
import AssignModal from '../componentsAdminFiches/AssignModal.tsx';
import ExportModalFiches from '../componentsAdminFiches/ExportMadalFiches.tsx'; // ✅ Corrigé l'orthographe
import { AuthContext } from '../../pages/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import HistoriqueFilesModal from '../componentsAdminFiches/HistoriqueFilesModal.tsx';
import DetailModal from '../componentsAdminFiches/DetailModal.tsx';
import Swal from 'sweetalert2';

// Composants extraits
import FichesHeader from '../componentsAdminFiches/FichesHeader.tsx';
import NavUniversFiches from '../componentsAdminFiches/NavUniversFiches.tsx';
import FichesFiltersBar from '../componentsAdminFiches/FichesFiltersBar.tsx';
import BatchActionsBar from '../componentsAdminFiches/BatchActionsBar.tsx';

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
    const [assignModal, setAssignModal] = useState<{ isOpen: boolean; ficheId: number | null; currentAgentId: number | null; }>({ isOpen: false, ficheId: null, currentAgentId: null });
    const [showExportModal, setShowExportModal] = useState(false);
    const [historiqueModal, setHistoriqueModal] = useState({isOpen: false, ficheId: null as number | null, });
    const [modalOpen, setModalOpen] = useState(false);

  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";
  const isManager = role === "Manager";


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

    const handleAssignFiche = (ficheId: number, currentAgentId?: number | null) => {
        setAssignModal({ isOpen: true, ficheId, currentAgentId: currentAgentId ?? null });
    };

    /**
     * ============================
     *   ASSIGNATION D’UNE FICHE
     * ============================
     */
    const handleAssignSubmit = async (agentId: number) => {
        try {
            const ficheIds = assignModal.ficheId ? [assignModal.ficheId] : selectedFiches;

            const res = await axiosInstance.put('/files/assigned_To', {
                ficheIds,
                agentId,
            });

            console.log(res.data.message);

            // 🔥 Mise à jour locale
            setFiches(prev =>
                prev.map(f =>
                    ficheIds.includes(f.id)
                        ? { ...f, assigned_to: agentId, statut: 'nouvelle' }
                        : f
                )
            );

            // Nettoyer la sélection
            setSelectedFiches(prev => prev.filter(id => !ficheIds.includes(id)));

            // Fermer le modal
            setAssignModal({
                isOpen: false,
                ficheId: null,
                currentAgentId: null,
            });

            return res.data;
        } catch (err: any) {
            console.error('Erreur assignation:', err.response?.data || err.message);
            throw err;
        }
    };


    /**
     * ============================
     *   DÉSASSIGNER UNE FICHE
     * ============================
     */
    const handleUnassignFiche = async (fiche: Fiche) => {
        const result = await Swal.fire({
            icon: 'question',
            title: 'Retirer l\'assignation',
            text: `Voulez-vous retirer la fiche assignée à ${fiche.assigned_to_name || 'cet agent'} ?`,
            showCancelButton: true,
            confirmButtonText: 'Oui, désassigner',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#dc2626',
        });

        if (result.isConfirmed) {
            try {
                const res = await axiosInstance.put('/files/unassign', { ficheIds: [fiche.id] });
                Swal.fire('Désassignée !', res.data.message, 'success');
                setFiches(prev => prev.filter(f => f.id !== fiche.id));
            } catch (err: any) {
                console.error(err);
                Swal.fire('Erreur', err.response?.data?.error || 'Erreur serveur', 'error');
            }
        }
    };

    /**
     * ============================
     *   DÉSASSIGNER plusieurs fiches
     * ============================
     */
    const handleBatchUnassign = async () => {
        const result = await Swal.fire({
            icon: 'question',
            title: 'Confirmer désassignation',
            text: `Voulez-vous vraiment désassigner ${selectedFiches.length} fiche(s) ?`,
            showCancelButton: true,
            confirmButtonText: 'Oui, désassigner',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#6d28d9',
            cancelButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) return;

        try {
            const ids = selectedFiches;

            const res = await axiosInstance.put('/files/unassign', {
                ficheIds: ids
            });

            Swal.fire('Succès', res.data.message, 'success');

            setFiches(prev =>
                prev.map(f =>
                    ids.includes(f.id)
                        ? { ...f, agent_id: null, agent_name: null }
                        : f
                )
            );

            setSelectedFiches([]);

        } catch (e: any) {
            Swal.fire('Erreur', e.response?.data?.error || 'Erreur serveur', 'error');
        }
    };

    /**
    * ============================
    *   Supprimer une fiche
    * ============================
    */
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
                setFiches(prev => prev.filter(f => f.id !== ficheId));
            } catch (err: any) {
                console.error(err);
                Swal.fire('Erreur', err.response?.data?.error || 'Erreur serveur', 'error');
            }
        }
    };

    /**
    * ============================
    *   Supprimer plusieurs fiches
    * ============================
    */
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
                data: { ficheIds: ids }
            });

            Swal.fire('Supprimées', res.data.message, 'success');

            setFiches(prev => prev.filter(f => !ids.includes(f.id)));
            setSelectedFiches([]);

        } catch (e: any) {
            Swal.fire('Erreur', e.response?.data?.error || 'Erreur serveur', 'error');
        }
    };
    /**
    * ============================
    *   importer des fiches
    * ============================
    */
    const onImportFiches = async (importedData: any) => {
        try {
            const response = await axiosInstance.put("/files/import_files", {
                files: importedData,
            });

            const result = response.data;

            setFiches((prev) => [...prev, ...result.addedFiches]);
            console.log("✅ Import réussi:", result);

            return result;
        } catch (error: any) {
            console.error("❌ Erreur import:", error.response?.data || error.message);
            throw error;
        }
    };

    const filteredFiches = useMemo(() => {
        let result = fiches.filter((f) => f.univers === activeTab);
        switch (activeFilter) {
            case 'nouvelles': result = result.filter(f => f.statut === 'nouvelle' && !f.assigned_to); break;
            case 'assignees': result = result.filter(f => f.statut === 'nouvelle' && f.assigned_to); break;
            case 'en_cours': result = result.filter(f => f.statut === 'en_traitement'); break;
            case 'rendez_vous': result = result.filter(f => f.statut === 'rendez_vous'); break;
            case 'cloturees': result = result.filter(f => f.statut === 'cloturee'); break;
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(f =>
                f.nom_client.toLowerCase().includes(term) ||
                f.prenom_client.toLowerCase().includes(term) ||
                (f.numero_mobile || '').includes(term) ||
                (f.numero_fixe || '').includes(term) ||
                (f.mail_client || '').toLowerCase().includes(term) ||
                (f.ville_client || '').toLowerCase().includes(term) ||
                (f.univers || '').toLowerCase().includes(term) ||
                (f.tag || '').toLocaleLowerCase().includes(term) ||
                f.id.toString().includes(term)

            );
        }
        if (searchAgentTerm) {
            const agentTerm = searchAgentTerm.toLowerCase();
            result = result.filter(f => (f.assigned_to_name || '').toLowerCase().includes(agentTerm));
        }
        return result;
    }, [fiches, activeFilter, activeTab, searchTerm, searchAgentTerm]);

    const counters = useMemo(() => {
        const fichesByUnivers = fiches.filter(f => f.univers === activeTab);
        return {
            nouvelles: fichesByUnivers.filter(f => f.statut === 'nouvelle' && !f.assigned_to).length,
            assignees: fichesByUnivers.filter(f => f.statut === 'nouvelle' && f.assigned_to).length,
            en_cours: fichesByUnivers.filter(f => f.statut === 'en_traitement').length,
            rendez_vous: fichesByUnivers.filter(f => f.statut === 'rendez_vous').length,
            cloturees: fichesByUnivers.filter(f => f.statut === 'cloturee').length,
            toutes: fichesByUnivers.length,
        };
    }, [fiches, activeTab]);

    const handleBatchSizeChange = (value: number | '') => {
        setBatchSize(value);
        if (typeof value === 'number') {
            setSelectedFiches(filteredFiches.slice(0, value).map(f => f.id));
        } else {
            setSelectedFiches([]);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="space-y-6">
                <FichesHeader
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onOpenImport={() => setShowImportModal(true)}
                    onOpenExport={() => setShowExportModal(true)}
                />

                <NavUniversFiches
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="bg-white shadow-md rounded-b-xl border border-gray-200 p-6">
                    <FichesFiltersBar
                        activeFilter={activeFilter}
                        counters={counters}
                        searchAgentTerm={searchAgentTerm}
                        onFilterChange={(f) => setTabFilters(prev => ({ ...prev, [activeTab]: f }))}
                        onAgentSearchChange={setSearchAgentTerm}
                        onRefresh={fetchFiches}
                    />

                    <BatchActionsBar
                        batchSize={batchSize}
                        selectedFichesCount={selectedFiches.length}
                        activeFilter={activeFilter}
                        onBatchSizeChange={handleBatchSizeChange}
                        onAssignBatch={() => setAssignModal({ isOpen: true, ficheId: null, currentAgentId: null })}
                        onBatchUnassign={handleBatchUnassign}
                        onBatchDelete={handleBatchDelete}
                        isAdmin={isAdmin}
                        isManager={isManager}
                    />

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
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700 whitespace-nowrap">N° fiche</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Client</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700 whitespace-nowrap">Numéro mobile</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Statut / tag</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Assignée à</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700 whitespace-nowrap">Date import</th>
                                            <th className="px-6 py-3 text-center text-sm font-semibold text-blue-700">Actions</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedFiches(filteredFiches.map(f => f.id));
                                                        else setSelectedFiches([]);
                                                    }}
                                                    checked={selectedFiches.length === filteredFiches.length && filteredFiches.length > 0}
                                                />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFiches.map(fiche => (
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
                                                    if (checked) setSelectedFiches(prev => [...prev, id]);
                                                    else setSelectedFiches(prev => prev.filter(i => i !== id));
                                                }}
                                                isAdmin={isAdmin}
                                                isManager={isManager}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modaux (inchangés) */}
                <ImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onImport={onImportFiches}
                />
                <AssignModal
                    isOpen={assignModal.isOpen}
                    onClose={() => setAssignModal({ isOpen: false, ficheId: null, currentAgentId: null })}
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