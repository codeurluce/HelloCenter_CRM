import React, { useEffect, useState } from "react";
import { 
  X,
  CheckCircle, 
  Clock, 
  PlayCircle, 
  RotateCcw, 
  CalendarClock,
  Import,
  Redo
} from "lucide-react";
import dayjs from "dayjs";
import axiosInstance from "../../api/axiosInstance";

interface HistoriqueFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ficheId: number | null;
}

export default function HistoriqueFilesModal({ isOpen, onClose, ficheId }: HistoriqueFilesModalProps) {
  const [historique, setHistorique] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ficheId) {
      fetchHistorique();
    }
  }, [isOpen, ficheId]);

  const fetchHistorique = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/historiques/${ficheId}`);
      setHistorique(res.data);
    } catch (err) {
      console.error("Erreur chargement historique", err);
    } finally {
      setLoading(false);
    }
  };

if (!isOpen) return null;

  const renderIcon = (action: string) => {
    switch (action) {
      case "ASSIGNATION":
        return <Redo className="text-purple-500" size={18} />;
      case "IMPORTATION":
        return <Import className="text-blue-500" size={18} />;
      case "CLOTURE":
        return <CheckCircle className="text-red-500" size={18} />;
      case "PRISE_EN_CHARGE":
        return <PlayCircle className="text-green-500" size={18} />;
    //   case "ANNULATION":
    //     return <RotateCcw className="text-orange-500" size={18} />;
      case "PROGRAMMATION_RDV":
        return <CalendarClock className="text-orange-500" size={18} />;
      default:
        return <Clock className="text-gray-400" size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Historique de la fiche N° {ficheId}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <p className="text-center text-gray-500">Chargement...</p>
        ) : historique.length === 0 ? (
          <p className="text-center text-gray-400">Aucun historique trouvé</p>
        ) : (
          <ul className="space-y-4 max-h-[400px] overflow-y-auto">
            {historique.map((h, idx) => (
              <li key={idx} className="flex items-start gap-3">
                {/* Icône */}
                <div className="mt-1">{renderIcon(h.action)}</div>

                {/* Texte */}
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{h.actor_name}</span> – {h.commentaire}
                  </p>
                  <p className="text-xs text-gray-400">
                    {dayjs(h.date_action || h.created_at).format("DD/MM/YYYY HH:mm:ss")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}