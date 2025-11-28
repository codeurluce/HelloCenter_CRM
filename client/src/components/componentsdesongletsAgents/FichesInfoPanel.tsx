import React, { useState, useMemo, useContext } from 'react';
import { FileText, Clock, CheckCircle, CalendarClock, Filter, RefreshCw } from 'lucide-react';
import { Fiche, ClotureData } from '../componentsdesfiches/types/fiche.ts';
import FicheCard from '../componentsdesfiches/FicheCard.tsx';
import ClotureModal from '../componentsdesfiches/ClotureModal.tsx';
import { AuthContext } from '../../pages/AuthContext.jsx';
import RendezVousModal from '../componentsdesfiches/RendezVousModal.jsx';
import FichesSearchBar from '../componentsAdminFiches/FichesSearchBar.tsx';
import axiosInstance from '../../api/axiosInstance.js';

interface FichesInfoPanelProps {
  fiches: Fiche[];
  loading: boolean;
  onRefresh: () => void;
  onTreatFiche: (id: number) => void;
  onCancelFiche: (id: number) => void;
  onCloseFiche: (id: number, data: ClotureData) => void;
  onProgramRdv: (id: number, date: string, commentaire: string, tag: string) => void;
  onEnregistrerFicheSansCloture: (id: number, data: ClotureData) => void;
}

type FilterType = 'nouvelle' | 'en_traitement' | 'rendez_vous' | 'cloturee' | 'toutes';

const FichesInfoPanel: React.FC<FichesInfoPanelProps> = ({
  fiches,
  loading,
  onRefresh,
  onTreatFiche,
  onCancelFiche,
  onCloseFiche,
  onProgramRdv,
  onEnregistrerFicheSansCloture,
}) => {
  const { user } = useContext(AuthContext);
  const [activeFilter, setActiveFilter] = useState<FilterType>('nouvelle');
  const [clotureModal, setClotureModal] = useState<{
    isOpen: boolean;
    ficheId: number | null;
    clientName: string;
  }>({
    isOpen: false,
    ficheId: null,
    clientName: '',
  });

  const [showRdvModal, setShowRdvModal] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState<Fiche | null>(null);
  const [showRdvDetailsModal, setShowRdvDetailsModal] = useState(false);
  const [selectedClotureFiche, setSelectedClotureFiche] = useState<Fiche | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rdvTag, setRdvTag] = useState<string | null>(null);


  // Filtrage selon rôle utilisateur
  const fichesFiltreesParRole = useMemo(() => {
    if (!user || !Array.isArray(fiches)) return [];

    if (user.role === 'Manager') {
      return fiches;
    }
    // Agent voit seulement ses fiches
    return fiches.filter(
      (f) => f.assigned_to?.toString() === user.id.toString()
    );
  }, [fiches, user]);

  // Compteurs par statut
  const counters = useMemo(
    () => ({
      nouvelle: fichesFiltreesParRole.filter((f) => f.statut === 'nouvelle').length,
      en_traitement: fichesFiltreesParRole.filter((f) => f.statut === 'en_traitement').length,
      rendez_vous: fichesFiltreesParRole.filter((f) => f.statut === 'rendez_vous').length,
      cloturee: fichesFiltreesParRole.filter((f) => f.statut === 'cloturee').length,
      toutes: fichesFiltreesParRole.length,
    }),
    [fichesFiltreesParRole]
  );

  // Appelée par ClotureModal quand un tag "Relance" ou "Rappel" est choisi
  const handleRequestRdvWithTag = (ficheId: number, tag: string) => {
    const fiche = fiches.find(f => f.id === ficheId);
    if (fiche) {
      setSelectedFiche(fiche);
      setRdvTag(tag); // ✅ sauvegarde le tag temporairement
      setShowRdvModal(true);
    }
  };

  // Filtrage affichage par filtre actif
  // const filteredFiches = useMemo(() => {
  //   const base = activeFilter === 'toutes'
  //     ? fichesFiltreesParRole
  //     : fichesFiltreesParRole.filter((f) => f.statut === activeFilter);

  //   if (!searchTerm.trim()) return base;

  //   return base.filter((f) => {
  //     const term = searchTerm.toLowerCase();
  //     return (
  //       f.nom_client?.toLowerCase().includes(term) ||
  //       f.prenom_client?.toLowerCase().includes(term) ||
  //       f.numero_mobile?.toLowerCase().includes(term) ||
  //       f.id?.toString().includes(term)
  //     );
  //   });
  // }, [fichesFiltreesParRole, activeFilter, searchTerm]);

  const filteredFiches = useMemo(() => {
  const base = activeFilter === 'toutes'
    ? fichesFiltreesParRole
    : fichesFiltreesParRole.filter((f) => f.statut === activeFilter);

  // 🔍 Filtre search
  const searched = !searchTerm.trim()
    ? base
    : base.filter((f) => {
        const term = searchTerm.toLowerCase();
        return (
          f.nom_client?.toLowerCase().includes(term) ||
          f.prenom_client?.toLowerCase().includes(term) ||
          f.numero_mobile?.toLowerCase().includes(term) ||
          f.id?.toString().includes(term)
        );
      });

  // 📌 TRI : les fiches sans tag d’abord, ensuite celles avec tags (NRP, Relance…)
  return searched.sort((a, b) => {
    const hasTagA = a.tag ? 1 : 0;
    const hasTagB = b.tag ? 1 : 0;
    return hasTagA - hasTagB; 
  });
}, [fichesFiltreesParRole, activeFilter, searchTerm]);


  // Ouvre la modal RDV pour programmer un rendez-vous
  const handleOpenRdvModal = (ficheId: number) => {
    const fiche = fiches.find(f => f.id === ficheId);
    if (fiche) {
      setSelectedFiche(fiche);
      setShowRdvModal(true);
    }
  };

  // Ouvre la modal clôture pour cloturer une fiche
  const handleOpenClotureModal = (ficheId: number) => {
    const fiche = fiches.find((f) => f.id === ficheId);
    if (fiche) {
      setSelectedClotureFiche(fiche);
      setClotureModal({
        isOpen: true,
        ficheId,
        clientName: `${fiche.nom_client} ${fiche.prenom_client}`,
      });
    }
  };

  const enregistrerFicheSansCloture = async (id: number, payload: any) => {
    return axiosInstance.put(`/files/${id}/enregistrer`, payload);
  };


  const handleVoirRdvDetails = (fiche: Fiche) => {
    setSelectedFiche(fiche);
    setShowRdvDetailsModal(true);
  };

  // Soumet la clôture depuis la modal
  const handleClotureSubmit = (data: ClotureData) => {
    if (clotureModal.ficheId !== null) {
      onCloseFiche(clotureModal.ficheId, data);
      setClotureModal({ isOpen: false, ficheId: null, clientName: '' });
    }
  };

  // Styles et labels filtres
  const getFilterClass = (filter: FilterType) => {
    const base =
      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ';
    return (
      base +
      (activeFilter === filter
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300')
    );
  };

  const getFilterIcon = (filter: FilterType) => {
    switch (filter) {
      case 'nouvelle':
        return <FileText size={16} />;
      case 'en_traitement':
        return <Clock size={16} />;
      case 'rendez_vous':
        return <CalendarClock size={16} />;
      case 'cloturee':
        return <CheckCircle size={16} />;
      default:
        return <Filter size={16} />;
    }
  };

  const getFilterLabel = (filter: FilterType) => {
    switch (filter) {
      case 'nouvelle':
        return 'Nouvelles';
      case 'en_traitement':
        return 'En cours';
      case 'rendez_vous':
        return 'Rendez vous';
      case 'cloturee':
        return 'Clôturées';
      default:
        return 'Toutes';
    }
  };

  // Modal pour voir détails RDV
  const RdvDetailsModal = ({
    fiche,
    isOpen,
    onClose,
  }: {
    fiche: Fiche | null;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen || !fiche) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl relative animate-fade-in">
          {/* Bouton de fermeture */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Fermer"
          >
            &times;
          </button>

          <h2 className="text-2xl font-semibold mb-6 text-center">
            Détails du Rendez-vous
          </h2>

          <div className="space-y-4">
            <div>
              <span className="font-medium text-gray-700">Date prévue :</span>{' '}
              <span className="text-gray-900">
                {fiche.rendez_vous_date
                  ? new Date(fiche.rendez_vous_date).toLocaleString()
                  : 'Non définie'}
              </span>
            </div>

            <div>
              <span className="font-medium text-gray-700">Commentaire :</span>
              <div className="mt-1 p-3 bg-gray-100 rounded-lg text-gray-800">
                {fiche.rendez_vous_commentaire || 'Aucun commentaire'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Fiches</h2>
        <p className="text-gray-600">Gestion complète de mes fiches</p>

        <div className="bg-white rounded-xl shadow-sm p-6">

          {/* <p className="text-gray-600">Suivez vos fiches clients</p> */}

          <div className="bg-white rounded-xl shadow-sm ">
            <div className="flex flex-wrap gap-3 mb-6">
              {(['nouvelle', 'en_traitement', 'rendez_vous', 'cloturee', 'toutes'] as FilterType[]).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={getFilterClass(filter)}
                  >
                    {getFilterIcon(filter)}
                    <span>{getFilterLabel(filter)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${activeFilter === filter
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-100 text-blue-600'
                        }`}
                    >
                      {counters[filter]}
                    </span>
                  </button>

                )
              )}

              <FichesSearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />

              <button onClick={onRefresh}
                className="flex items-center ml-auto gap-2 py-1 px-3 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-100 transition"
                disabled={loading}
                aria-label="Rafraîchir les fiches">
                <RefreshCw size={16} />
                {loading ? 'Chargement...' : 'Rafraîchir'}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Chargement des fiches...</p>
                  </div>
                ) : filteredFiches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {getFilterIcon(activeFilter)}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune fiche trouvée
                    </h3>
                    <p className="text-gray-500">
                      Il n'y a aucune fiche avec le statut "
                      {getFilterLabel(activeFilter).toLowerCase()}".
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredFiches.map((fiche) => (
                      <div key={fiche.id} className="relative">
                        <FicheCard
                          fiche={fiche}
                          currentAgent={user?.id.toString() || ''}
                          onTreatFiche={() => onTreatFiche(fiche.id)}
                          onCancelFiche={() => onCancelFiche(fiche.id)}
                          onOpenClotureModal={() => handleOpenClotureModal(fiche.id)}
                          onVoirRdvDetails={() => handleVoirRdvDetails(fiche)}
                        />
                      </div>
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
        onClose={() => {
          setClotureModal({ isOpen: false, ficheId: null, clientName: '' });
          setSelectedClotureFiche(null);
        }}
        onSubmit={handleClotureSubmit}
        ficheId={clotureModal.ficheId || 0}
        clientName={clotureModal.clientName}
        fiche={selectedClotureFiche}
        onProgramRdv={handleRequestRdvWithTag}
        onSaveNRP={onEnregistrerFicheSansCloture}
      />

      <RendezVousModal
        isOpen={showRdvModal}
        onClose={() => setShowRdvModal(false)}
        onConfirm={({ date, commentaire }: { date: string; commentaire: string }) => {
          if (selectedFiche && rdvTag) {
            onProgramRdv(selectedFiche.id, date, commentaire, rdvTag);
            setShowRdvModal(false);
            setRdvTag(null);
          }
        }}
      />

      <RdvDetailsModal
        fiche={selectedFiche}
        isOpen={showRdvDetailsModal}
        onClose={() => setShowRdvDetailsModal(false)}
      />
    </div>
  );
};

export default FichesInfoPanel;