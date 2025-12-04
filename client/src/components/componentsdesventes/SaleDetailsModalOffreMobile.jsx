import React, { useEffect, useCallback } from "react";
import { X, Edit3, FileText } from "lucide-react";

const SaleDetailsModalOffreMobile = ({ sale, onClose, onEdit, getStatusText, isAdmin, isManager }) => {

  const isAdminOrManager = isAdmin || isManager;
  // Gestion touche Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const stopPropagation = useCallback((e) => e.stopPropagation(), []);

  // Mapping couleurs
  const statusColors = {
    payee: "bg-green-600",
    default: "bg-blue-600",
    annule: "bg-red-600",
  };

  const detectStatusKey = (status) => {
    const normalized = (status || "").toLowerCase().trim();
    if (normalized === "validated") return "payee";
    if (normalized === "cancelled") return "annule";
    return "default";
  };

  if (!sale) return null;

  const statusKey = detectStatusKey(sale.status);
  const statusColor = statusColors[statusKey] || statusColors.default;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-2xl max-w-3xl w-full p-0 max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100"
        onClick={stopPropagation}
      >
        {/* En-tête */}
        <div className={`${statusColor} text-white flex items-center justify-between px-6 py-4`}>
          <div className="flex items-center gap-2">
            <FileText size={22} />
            <h3 className="text-lg font-bold">Détails de la vente N° : {sale.id}</h3>
          </div>
          <p className="text-lg font-bold">Type de vente : {sale.product_type}</p>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-4 overflow-y-auto text-gray-800">
          <div className="grid grid-cols-2 gap-8">

            {/* Colonne gauche - Client */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-1">
                Informations Client
              </h3>
              {/* <Detail label="Réf. Client" value={sale.ref_client || "-"} /> */}
              <Detail
                label="Client"
                value={`${sale.civilite || ""} ${sale.client_name || ""} ${sale.client_firstname || ""}`.trim()}
              />
              <Detail label="Compte Agent" value={sale.free_agent_account || "-"} />
              {isAdminOrManager && (
                <>
                  <Detail label="Téléphone" value={sale.client_phone || "-"} />
                  <Detail label="Num Fixe" value={sale.client_phone_fix || "-"} />
                  <Detail label="Email" value={sale.client_email || "-"} />
                </>)}
              <Detail label="Ville" value={sale.ville_client || "-"} />
              <Detail label="Adresse" value={sale.adresse_client || "-"} />
              <Detail label="Code Postal" value={sale.code_postal_client || "-"} />
            </div>

            {/* Colonne droite - Vente */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-1">
                Informations Vente
              </h3>
              <Detail label="Réf. CMD" value={sale.ref_cmd || "-"} />
              <Detail label="État CMD" value={sale.etat_cmd || "-"} />
              {/* <Detail label="Type de vente" value={sale.product_type || "-"} /> */}
              <Detail label="Opt Smartphone" value={sale.option_smartphone || "-"} />
              <Detail label="Autres Options" value={sale.autres_options || "-"} />
              <Detail label="Engagement" value={sale.engagement ? "Oui" : "Non"} />
              <Detail label="Ancien Opérateur" value={sale.ancien_operateur || "-"} />
              <Detail label="Type Technologie" value={sale.type_technologie || "-"} />
              <Detail label="Prix Offre" value={sale.prix_offre || "-"} />
              <Detail label="Provenance Fichier" value={sale.provenance_fichier || "-"} />
              <Detail label="IBAN" value={sale.iban || "-"} />
              <Detail label="RIO" value={sale.rio || "-"} />
              <Detail label="Date" value={sale.created_at ? new Date(sale.created_at).toLocaleString("fr-FR") : "-"} />
              <Detail
                label="Statut"
                value={
                  <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${statusColor}`}>
                    {getStatusText ? getStatusText(sale.status) : sale.status || statusKey}
                  </span>
                }
              />
              {statusKey === "annule" && <Detail label="Motif" value={sale.cancelled_reason || "-"} />}
            </div>

          </div>
        </div>

        {/* Footer : bouton Modifier si statut pending */}
        {isAdmin && statusKey === "default" && (
          <div className="flex justify-end bg-gray-100 px-6 py-4">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg shadow-sm transition-colors"
            >
              <Edit3 size={18} />
              Modifier
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div className="flex items-center py-1 border-b border-gray-100">
    <span className="font-medium text-black-600 w-36">{label} :</span>
    <span className={value === '-' ? 'text-gray-400 italic' : 'text-gray-600'}>
      {value}
    </span>
  </div>
);

export default SaleDetailsModalOffreMobile;
