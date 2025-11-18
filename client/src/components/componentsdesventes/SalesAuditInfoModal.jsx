import { X } from "lucide-react";

export default function AuditInfoModal({ sale, onClose }) {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative">
        
        {/* Close button */}
<div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Détails Audite</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">

          <div>
            <p className="text-sm text-gray-500">Audité :</p>
            <p className="font-medium">{sale.audite ? "Oui" : "Non"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Audité par :</p>
            <p className="font-medium">
              {sale.audite_by_name || "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Date audit :</p>
            <p className="font-medium">
              {sale.date_audite
                ? new Date(sale.date_audite).toLocaleString()
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Commentaire :</p>
            <p className="font-medium whitespace-pre-wrap">
              {sale.audite_commentaire || "—"}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
