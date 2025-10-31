// src/componentsAdminRH/UsersContratDetailsModal.tsx
import React, { useEffect, useCallback } from "react";
import { X, User, Mail, MapPin, Calendar, CreditCard, VenusAndMars, Gem, Smartphone, Calendar1, CalendarCheck, CalendarDays, CreditCardIcon } from "lucide-react";

export interface Contrat {
  id: number;
  type_contrat?: string;
  date_integration?: string;
  date_debut_contrat?: string;
  date_fin_contrat?: string;
  poste?: string;
  situation_matrimoniale?: string;
  numero_cni_ou_passeport?: string;
  adresse?: string;
  code_postal?: string;
  telephone?: string;
  age?: number;
  genre_sexe?: string;
  mail_perso?: string;
  matricule?: string;
  date_naissance?: string;
  type_piece?: string;
  updated_by?: string;
}

export interface Agent {
  id: number;
  lastname: string;
  firstname: string;
  email: string;
  role: string;
  profil?: string;
  active?: boolean;
  created_at?: string;
  contrat?: Contrat | null;
}

interface Props {
  agent: Agent | null;
  onClose: () => void;
  onEdit: (agent: Agent) => void;
}

export default function UsersContratDetailsModal({ agent, onClose, onEdit }: Props) {
  const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!agent) return null;

  const c = agent.contrat;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  };

  return (
    <div
      className="fixed inset-0 bg-black/10 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-gray-100 max-w-3xl w-full overflow-hidden"
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <User size={22} />
            <h3 className="text-lg font-bold">
              Détails Contrat de l'agent : {agent.lastname} {agent.firstname}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6 overflow-y-auto text-gray-800">
          <div className="grid grid-cols-2 gap-8">
            {/* Infos personnelles */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-1">Infos personnelles</h3>
              <Detail label="Matricule" value={c?.matricule || "-"} icon={<CreditCard size={18} />} />
              <Detail label="Nom" value={agent.lastname} icon={<User size={18} />} />
              <Detail label="Prénom" value={agent.firstname} icon={<User size={18} />} />
              <Detail label="Email" value={c?.mail_perso || "-"} icon={<Mail size={18} />} />
              <Detail label="Téléphone" value={c?.telephone || "-"} icon={<Smartphone size={18} />} />
              <Detail label="Type de pièce" value={c?.type_piece || "-"} icon={<CreditCardIcon size={18} />} />
              <Detail label="Num CNI / Passeport" value={c?.numero_cni_ou_passeport || "-"} icon={<CreditCard size={18} />} />
              <Detail label="Date de naissance" value={c?.date_naissance ? formatDate(c.date_naissance) : "-"} icon={<Calendar size={18} />} />
              <Detail label="Situation matrimoniale" value={c?.situation_matrimoniale || "-"} icon={<Gem size={18} />} />
            </div>

            {/* Infos contrat */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-1">Infos contrat</h3>
              <Detail label="Type de contrat" value={c?.type_contrat || "-"} icon={<User size={18} />} />
              <Detail label="Poste" value={c?.poste || "-"} icon={<User size={18} />} />
              <Detail label="Date début contrat" value={formatDate(c?.date_debut_contrat)} icon={<Calendar1 size={18} />} />
              <Detail label="Date fin contrat" value={formatDate(c?.date_fin_contrat)} icon={<CalendarDays size={18} />} />
              <Detail label="Date intégration" value={formatDate(c?.date_integration)} icon={<CalendarCheck size={18} />} />
              <Detail label="Sexe" value={c?.genre_sexe || "-"} icon={<VenusAndMars size={18} />} />
              <Detail label="Age" value={c?.age?.toString() || "-"} icon={<User size={18} />} />
              <Detail label="Adresse" value={c?.adresse || "-"} icon={<MapPin size={18} />} />
              <Detail label="Code postal" value={c?.code_postal || "-"} icon={<MapPin size={18} />} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end bg-gray-100 px-6 py-4">
          {onEdit && (
            <button
              onClick={() => agent && onEdit(agent)}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg shadow-sm transition-colors mr-4"
            >
              Mettre à jour
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg shadow-sm transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

const Detail = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100">
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-medium text-gray-700">{label} :</span>
    </div>
    <span className={value === "-" ? "text-gray-400 italic" : "text-gray-900 font-mono"}>
      {value}
    </span>
  </div>
);
