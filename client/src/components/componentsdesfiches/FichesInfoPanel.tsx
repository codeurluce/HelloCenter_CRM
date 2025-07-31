import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Filter } from 'lucide-react';
import { Fiche, ClotureData } from './types/fiche';
import FicheCard from './FicheCard.tsx';
import ClotureModal from './ClotureModal.tsx';

interface FichesInfoPanelProps {
  fiches: Fiche[];
  currentAgent: string;
}

type FilterType = 'nouvelle' | 'en_traitement' | 'cloturee' | 'toutes';

const FichesInfoPanel: React.FC<FichesInfoPanelProps> = ({ fiches: initialFiches, currentAgent }) => {
  const [fiches, setFiches] = useState<Fiche[]>(initialFiches);
  const [activeFilter, setActiveFilter] = useState<FilterType>('nouvelle');
  const [agentUnivers, setAgentUnivers] = useState(currentAgent);
  const [clotureModal, setClotureModal] = useState({
    isOpen: false,
    ficheId: null as number | null,
    clientName: ''
  });

  useEffect(() => {
    setAgentUnivers(currentAgent);
  }, [currentAgent]);

  const updateFiche = (ficheId: number, updates: Partial<Fiche>) => {
    setFiches(prev =>
      prev.map(fiche =>
        fiche.id === ficheId ? { ...fiche, ...updates } : fiche
      )
    );
  };

  const onTreatFiche = (ficheId: number) => {
    updateFiche(ficheId, { statut: 'en_traitement', assignedTo: currentAgent, assignedToName: 'Alice Durand' });
  };

  const onCancelFiche = (ficheId: number) => {
    updateFiche(ficheId, { statut: 'nouvelle', assignedTo: null, assignedToName: null });
  };

  const onCloseFiche = (ficheId: number, data: ClotureData) => {
    updateFiche(ficheId, {
      statut: 'cloturee',
      tag: data.tag,
      commentaire: data.commentaire
    });
  };

  const onProgramRdv = (ficheId: number) => {
    alert(`RDV programmé pour fiche ID ${ficheId}`);
  };

  const fichesFiltreesParUnivers = useMemo(() => {
    if (!agentUnivers) return [];
    return fiches.filter(fiche => fiche.univers === agentUnivers);
  }, [fiches, agentUnivers]);

  const counters = useMemo(() => ({
    nouvelle: fichesFiltreesParUnivers.filter(f => f.statut === 'nouvelle').length,
    en_traitement: fichesFiltreesParUnivers.filter(f => f.statut === 'en_traitement').length,
    cloturee: fichesFiltreesParUnivers.filter(f => f.statut === 'cloturee').length,
    toutes: fichesFiltreesParUnivers.length
  }), [fichesFiltreesParUnivers]);

  const filteredFiches = useMemo(() => {
    if (activeFilter === 'toutes') return fichesFiltreesParUnivers;
    return fichesFiltreesParUnivers.filter(f => f.statut === activeFilter);
  }, [fichesFiltreesParUnivers, activeFilter]);

  const handleCloseFiche = (ficheId: number) => {
    const fiche = fiches.find(f => f.id === ficheId);
    if (fiche) {
      setClotureModal({
        isOpen: true,
        ficheId,
        clientName: `${fiche.nom_client} ${fiche.prenom_client}`
      });
    }
  };

  const handleClotureSubmit = (data: ClotureData) => {
    if (clotureModal.ficheId) {
      onCloseFiche(clotureModal.ficheId, data);
      setClotureModal({ isOpen: false, ficheId: null, clientName: '' });
    }
  };

  const getFilterClass = (filter: FilterType) => {
    const base = "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ";
    return base + (activeFilter === filter
      ? 'bg-blue-600 text-white shadow-md'
      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
    );
  };

  const getFilterIcon = (filter: FilterType) => {
    switch (filter) {
      case 'nouvelle': return <FileText size={16} />;
      case 'en_traitement': return <Clock size={16} />;
      case 'cloturee': return <CheckCircle size={16} />;
      default: return <Filter size={16} />;
    }
  };

  const getFilterLabel = (filter: FilterType) => {
    switch (filter) {
      case 'nouvelle': return 'Nouvelles';
      case 'en_traitement': return 'En cours';
      case 'cloturee': return 'Clôturées';
      default: return 'Toutes';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Fiches</h1>
          <p className="text-gray-600">Gérez et suivez l'état de vos fiches clients</p>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
            <div className="flex flex-wrap gap-3 mb-6">
              {(['nouvelle', 'en_traitement', 'cloturee', 'toutes'] as FilterType[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={getFilterClass(filter)}
                >
                  {getFilterIcon(filter)}
                  <span>{getFilterLabel(filter)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeFilter === filter
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {counters[filter]}
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6">
                {filteredFiches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {getFilterIcon(activeFilter)}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune fiche trouvée</h3>
                    <p className="text-gray-500">
                      Il n'y a aucune fiche avec le statut "{getFilterLabel(activeFilter).toLowerCase()}" pour le moment.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredFiches.map(fiche => (
                      <FicheCard
                        key={fiche.id}
                        fiche={fiche}
                        currentAgent={agentUnivers}
                        onTreatFiche={onTreatFiche}
                        onCloseFiche={handleCloseFiche}
                        onProgramRdv={onProgramRdv}
                        onCancelFiche={onCancelFiche}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClotureModal
        isOpen={clotureModal.isOpen}
        onClose={() => setClotureModal({ isOpen: false, ficheId: null, clientName: '' })}
        onSubmit={handleClotureSubmit}
        ficheId={clotureModal.ficheId || 0}
        clientName={clotureModal.clientName}
      />
    </div>
  );
};

export default FichesInfoPanel;
