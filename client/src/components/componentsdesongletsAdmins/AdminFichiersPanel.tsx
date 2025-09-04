import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
    Upload,
    Filter,
    Edit,
    Trash2,
    UserPlus,
    FileText,
    Clock,
    CheckCircle,
    CalendarClock,
    UserCheck,
    Search,
    Download,
    RefreshCw,
    UserPlus2,
    FileUp,
} from 'lucide-react';
import { Fiche, ClotureData } from '../componentsAdminFiches/fiche.ts';
import ImportModal from '../componentsAdminFiches/ImportModal.tsx';
import AssignModal from '../componentsAdminFiches/AssignModal.tsx';
import { AuthContext } from '../../pages/AuthContext.jsx';
import axiosInstance from '../../api/axiosInstance.js';

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

type AdminFilterType = 'nouvelles' | 'assignees' | 'en_cours' | 'rendez_vous' | 'cloturees' | 'toutes';

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
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedFiches, setSelectedFiches] = useState<number[]>([]);
    const [batchSize, setBatchSize] = useState<number | ''>('');
    const [assignModal, setAssignModal] = useState<{
        isOpen: boolean;
        ficheId: number | null;
        currentAgentId: number | null;
    }>({ isOpen: false, ficheId: null, currentAgentId: null });

    // Onglets univers
    const tabs = [
        { key: 'Energie', label: 'Énergie' },
        { key: 'OffreMobile', label: 'Box Internet' },
    ];
    const [activeTab, setActiveTab] = useState(tabs[0].key);
    const [tabFilters, setTabFilters] = useState<{ [key: string]: AdminFilterType }>({
        'Energie': 'nouvelles',
        'OffreMobile': 'nouvelles',
    });
    const activeFilter = tabFilters[activeTab];

    // Fetch fiches
    const fetchFiches = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/files/all_files');
            setFiches(response.data);
        } catch (error) {
            console.error('Erreur fetch fiches:', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchFiches(); }, []);

    const handleAssignSubmit = async (agentId: number) => {
        try {
            const ficheIds = assignModal.ficheId ? [assignModal.ficheId] : selectedFiches;
            const res = await axiosInstance.put('/files/assigned_To', { ficheIds, agentId });
            console.log(res.data.message);

            // Mise à jour locale
            setFiches(prev =>
                prev.map(f =>
                    ficheIds.includes(f.id) ? { ...f, assigned_to: agentId, statut: 'nouvelle' } : f
                )
            );

            setSelectedFiches(prev => prev.filter(id => !ficheIds.includes(id)));
            setAssignModal({ isOpen: false, ficheId: null, currentAgentId: null });
            return res.data;
        } catch (err: any) {
            console.error('Erreur assignation:', err);
            throw err;
        }
    }

    const onImportFiches = async (importedData: any) => {
        try {
            const response = await axiosInstance.put("/files/import_files", {
                files: importedData,
            });

            const result = response.data;

            setFiches((prev) => [...prev, ...result.addedFiches]);
            console.log("✅ Import réussi:", result);

            return result; // <-- renvoyer la réponse si besoin
        } catch (error) {
            console.error("❌ Erreur import:", error);
            throw error; // <-- relancer pour que l'enfant sache qu'il y a eu une erreur
        }
    };

    // Filtrage fiches
    const filteredFiches = useMemo(() => {
        let result = fiches.filter(f => f.univers === activeTab);
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
                (f.mail_client || '').toLowerCase().includes(term) ||
                (f.univers || '').toLowerCase().includes(term)
            );
        }
        return result;
    }, [fiches, activeFilter, searchTerm, activeTab]);

    // Compteurs
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

    // Batch select
    const handleBatchSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = parseInt(e.target.value, 10);
        setBatchSize(isNaN(value) ? '' : value);
        if (!isNaN(value)) setSelectedFiches(filteredFiches.slice(0, value).map(f => f.id));
        else setSelectedFiches([]);
    };

    // Assign modal
    const handleAssignFiche = (ficheId: number, currentAgentId?: number) => {
        setAssignModal({ isOpen: true, ficheId, currentAgentId: currentAgentId || null });
    };


    // Statut badge
    const getStatusBadge = (statut: string, assigned_to?: number) => {
        let bgColor, textColor, label;
        if (statut === 'nouvelle' && !assigned_to) { bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; label = 'Nouvelle'; }
        else if (statut === 'nouvelle' && assigned_to) { bgColor = 'bg-purple-100'; textColor = 'text-purple-800'; label = 'Assignée'; }
        else if (statut === 'en_traitement') { bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; label = 'En traitement'; }
        else if (statut === 'rendez_vous') { bgColor = 'bg-amber-100'; textColor = 'text-amber-800'; label = 'RDV'; }
        else if (statut === 'cloturee') { bgColor = 'bg-green-100'; textColor = 'text-green-800'; label = 'Clôturée'; }
        else { bgColor = 'bg-gray-100'; textColor = 'text-gray-800'; label = statut; }
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>{label}</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className=" space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Administration des Fiches</h2>
                        <p className="text-gray-600">Gestion complète et assignation aux agents</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, téléphone, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                            />
                        </div>
                        <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
                            <Upload size={18} /> Importer
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm">
                            <Download size={18} /> Exporter </button>
                    </div>
                </div>

                {/* Tabs */}
                <nav className="flex space-x-2 mb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-6 py-3 rounded-t-xl font-medium text-sm transition-all
                ${activeTab === tab.key
                                    ? 'bg-white text-blue-600 shadow-md border border-b-0 border-gray-200'
                                    : 'bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 border border-transparent'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Fiches */}
                {!loading && (
                    <div className="bg-white shadow-md rounded-b-xl border border-gray-200 p-6">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {(['nouvelles', 'assignees', 'en_cours', 'rendez_vous', 'cloturees', 'toutes'] as AdminFilterType[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setTabFilters(prev => ({ ...prev, [activeTab]: f }))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${activeFilter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {f} <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">{counters[f]}</span>
                                </button>
                            ))}
                            <button onClick={fetchFiches} className="flex ml-6 items-center gap-2 py-1 px-3 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition">
                                <RefreshCw size={16} /> Rafraîchir
                            </button>
                        </div>

                        {/* Batch select */}
                        <div className="flex items-center gap-3 mb-4">
                            <label>Nombre de fiches :</label>
                            <select value={batchSize} onChange={handleBatchSizeChange} className="px-2 py-1 border rounded">
                                <option value="">-- Choisir --</option>
                                {[5, 10, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>

                            {selectedFiches.length > 0 && (
                                <button onClick={() => setAssignModal({ isOpen: true, ficheId: null, currentAgentId: null })} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm">
                                    <UserPlus size={18} /> Assigner {selectedFiches.length} fiches
                                </button>
                            )}
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            {filteredFiches.length === 0 ? (
                                <div className="text-center py-12">Aucune fiche trouvée</div>
                            ) : (
                                <div className=" border border-gray-300 rounded-t-lg overflow-hidden">
                                    <table className="w-full border-collapse" >
                                        <thead className="bg-blue-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700 whitespace-nowrap" >N° fiche</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700" >Client</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Contact</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Univers</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Statut</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Assignée à</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700 whitespace-nowrap">Date création</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700">Actions</th>
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
                                                <tr key={fiche.id} className={`border-t border-gray-200 transition-colors ${selectedFiches.includes(fiche.id) ? 'bg-blue-50' : 'hover:bg-blue-50'}`} >
                                                    <td className="px-6 py-3 text-gray-800">{fiche.id}</td>
                                                    <td className="px-6 py-3 text-gray-800">{fiche.nom_client} {fiche.prenom_client}</td>
                                                    <td className="px-6 py-3 text-gray-800">{fiche.numero_mobile} {fiche.mail_client}</td>
                                                    <td className="px-6 py-3 text-gray-800">{fiche.univers}</td>
                                                    <td className="px-6 py-3 text-gray-800">{getStatusBadge(fiche.statut, fiche.assigned_to)}</td>
                                                    <td className="px-6 py-3 text-gray-800">{fiche.assigned_to_name || 'Non assignée'}</td>
                                                    <td className="px-6 py-3 text-gray-800">{new Date(fiche.date_creation).toLocaleDateString('fr-FR')}</td>
                                                    <td className="px-6 py-3 text-gray-800">
                                                        {activeFilter === 'nouvelles' && (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleAssignFiche(fiche.id, fiche.assigned_to)}
                                                                    title={fiche.assigned_to ? 'Réassigner' : 'Assigner'}
                                                                    className="text-blue-600 hover:text-gray-800 px-6 py-3"
                                                                >
                                                                    <FileUp size={16} />
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Si besoin, tu peux aussi mettre d’autres actions visibles partout */}
                                                        {activeFilter !== 'nouvelles' && (
                                                            <div className="flex items-center gap-2">
                                                                <button title="Voir fiche" className="text-blue-600 hover:text-gray-800 px-6 py-3">
                                                                    <FileText size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-gray-800">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedFiches.includes(fiche.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedFiches(prev => [...prev, fiche.id]);
                                                                else setSelectedFiches(prev => prev.filter(id => id !== fiche.id));
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modals */}
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
            </div>
        </div>
    );
};

export default AdminFichiersPanel;
