// type/fiche.ts

export interface Fiche {
  assigned_to: string;
  id: number;
  univers: string;
  nom_client: string;
  prenom_client: string;
  adresse_client?: string;
  code_postal?: string;
  ville_client?: string;
  mail_client?: string;
  numero_mobile?: string;
  statut: 'nouvelle' | 'en_traitement' | 'rendez_vous' | 'cloturee';
  commentaire?: string;
  agent_id: number;
  agent_firstname?: string | null;
  agent_lastname?: string | null;
  date_creation: string;
  date_modification: string;
  date_import: string;
  tag?: string;
  assigned_to_name?: string;
  rendez_vous_date?: string;
  rendez_vous_commentaire?: string;
  pdl?: string;
  pce?: string;
}

export interface ClotureData {
  commentaire: string;
  tag: string;
}

export interface RdvData {
  rdvDate: string;
  commentaire: string;
  tag?: string;
}

export const PREDEFINED_TAGS = [
  'Vente',
  'Ne répond pas (NRP)',
  'Refus d\'Entretien (RE)',
  'Repondeur (Rep)',
  'Refus Argumenté (RA)',
  'Rappel (R)',
  'Faux Numéro (FN)',
  'Relance (RL)',
  'Hors Cible',
];

export const SAVE_ONLY_TAGS = [
  "Ne répond pas (NRP)",
  "Repondeur (Rep)",
  "Faux Numéro (FN)",
  "Refus d'Entretien (RE)",
  "Refus Argumenté (RA)",
  "Hors Cible",
];