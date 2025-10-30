// src/componentsRH/AgentDetailsModal.tsx
import React, { useEffect, useCallback, useState } from "react";
import { X, User, Mail, Phone, MapPin, Calendar, CreditCard, VenusAndMars, BellRing, Gem, Smartphone, Calendar1, CalendarCheck, CalendarDays } from "lucide-react";

interface Agent {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  matricule?: string;
  poste?: string;
  date_naissance?: string;
  sexe?: string;
  age?: number;
  situation_matrimoniale?: string;
  adresse?: string;
  code_postal?: string;
  num_cni?: string;
  type_contrat?: string;
  date_debut_contrat?: string;
  date_fin_contrat?: string;
  date_integration?: string;
}

interface Props {
  agent: Agent | null;
  onClose: () => void;
}

export default function UsersContratDetailsModal({ agent, onClose }: Props) {
  const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!agent) return null;

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
              Détails de l'agent : {agent.nom} {agent.prenom}
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
            {/* Colonne gauche : Infos personnelles */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-1">Infos personnelles</h3>
              <Detail label="Matricule" value={agent.matricule || "-"} icon={<CreditCard size={18} />} />
              <Detail label="Nom" value={agent.nom} icon={<User size={18} />} />
              <Detail label="Prénom" value={agent.prenom} icon={<User size={18} />} />
              <Detail label="Email" value={agent.email} icon={<Mail size={18} />} />
              <Detail label="Téléphone" value={agent.telephone || "-"} icon={<Smartphone size={18} />} />
              <Detail label="Date de naissance" value={formatDate(agent.date_naissance)} icon={<Calendar size={18} />} />
              <Detail label="Sexe" value={agent.sexe || "-"} icon={<VenusAndMars size={18} />} />
              <Detail label="Age" value={agent.age?.toString() || "-"} icon={<User size={18} />} />
              <Detail label="Situation matrimoniale" value={agent.situation_matrimoniale || "-"} icon={<Gem size={18} />} />
            </div>

            {/* Colonne droite : Infos contrat */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-1">Infos contrat</h3>
              <Detail label="Poste" value={agent.poste || "-"} icon={<User size={18} />} />
              <Detail label="Adresse" value={agent.adresse || "-"} icon={<MapPin size={18} />} />
              <Detail label="Code postal" value={agent.code_postal || "-"} icon={<MapPin size={18} />} />
              <Detail label="Num CNI / Passeport" value={agent.num_cni || "-"} icon={<CreditCard size={18} />} />
              <Detail label="Type de contrat" value={agent.type_contrat || "-"} icon={<User size={18} />} />
              <Detail label="Date début contrat" value={formatDate(agent.date_debut_contrat)} icon={<Calendar1 size={18} />} />
              <Detail label="Date fin contrat" value={formatDate(agent.date_fin_contrat)} icon={<CalendarDays size={18} />} />
              <Detail label="Date intégration" value={formatDate(agent.date_integration)} icon={<CalendarCheck size={18} />} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end bg-gray-100 px-6 py-4">
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
