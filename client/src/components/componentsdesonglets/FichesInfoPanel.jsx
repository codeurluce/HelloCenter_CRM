import React, { useState } from 'react';
import { User, Lock, MessageSquare, Calendar, CheckCircle, Play } from 'lucide-react';

const FichesInfoPanel = ({
  fiches,
  currentAgent,
  onTreatFiche,
  onCloseFiche,
  onScheduleAppointment
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'nouvelle' | 'en_traitement' | 'traitee'
  const [closingFiche, setClosingFiche] = useState(null);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState('');

  const filteredFiches = (fiches || []).filter(fiche => {
    if (filter === 'all') return true;
    return fiche.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'nouvelle': return 'bg-blue-100 text-blue-800';
      case 'en_traitement': return 'bg-yellow-100 text-yellow-800';
      case 'traitee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'nouvelle': return 'Nouvelle';
      case 'en_traitement': return 'En traitement';
      case 'traitee': return 'Traitée';
      default: return status;
    }
  };

  const handleCloseFiche = (ficheId) => {
    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
    onCloseFiche(ficheId, comment, tagsArray);
    setClosingFiche(null);
    setComment('');
    setTags('');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'nouvelle', label: 'Nouvelles' },
          { key: 'en_traitement', label: 'En traitement' },
          { key: 'traitee', label: 'Traitées' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredFiches.map(fiche => (
          <div key={fiche.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{fiche.client}</h3>
                <p className="text-gray-600 mt-1">{fiche.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(fiche.status)}`}>
                  {getStatusText(fiche.status)}
                </span>
                {fiche.lockedBy && fiche.lockedBy !== currentAgent && (
                  <div className="flex items-center gap-1 text-red-600">
                    <Lock size={16} />
                    <span className="text-sm">{fiche.lockedBy}</span>
                  </div>
                )}
              </div>
            </div>

            {fiche.comments && (
              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Commentaires</span>
                </div>
                <p className="text-sm text-gray-600">{fiche.comments}</p>
              </div>
            )}

            {fiche.tags && fiche.tags.length > 0 && (
              <div className="flex gap-2 mb-4">
                {fiche.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {fiche.status === 'nouvelle' && !fiche.lockedBy && (
                <button
                  onClick={() => onTreatFiche(fiche.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  type="button"
                >
                  <Play size={16} />
                  Prendre en charge
                </button>
              )}

              {fiche.status === 'en_traitement' && fiche.assignedTo === currentAgent && (
                <>
                  <button
                    onClick={() => onScheduleAppointment(fiche.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    type="button"
                  >
                    <Calendar size={16} />
                    Programmer RDV
                  </button>
                  <button
                    onClick={() => setClosingFiche(fiche.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    type="button"
                  >
                    <CheckCircle size={16} />
                    Clôturer
                  </button>
                </>
              )}

              {fiche.assignedTo && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>Assigné à: {fiche.assignedTo}</span>
                </div>
              )}
            </div>

            {closingFiche === fiche.id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-3">Clôturer la fiche</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commentaire final
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Résumé du traitement..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="urgent, client-vip, rappel"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCloseFiche(fiche.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      type="button"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setClosingFiche(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                      type="button"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {filteredFiches.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Aucune fiche trouvée pour ce filtre.</p>
        </div>
      )}
    </div>
  );
};

export default FichesInfoPanel;
