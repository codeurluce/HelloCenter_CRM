export interface Fiche {
  id: number;
  nom_client: string;
  prenom_client: string;
  numero_mobile: string;
  numero_fixe: string;
  ville_client: string;
  mail_client: string;
  adresse_client: string;
  code_postal: string;
  univers: string;
  statut: 'nouvelle' | 'en_traitement' | 'rendez_vous' | 'cloturee';
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  agent_id?: number | null;
  agent_firstname?: string | null;
  agent_lastname?: string | null;
  ref_fiche?: string;
  client_name?: string;
  date_creation: string;
  date_traitement?: string;
  date_cloture?: string;
  commentaire?: string;
  tag?: string;
  rendez_vous_date?: string;
  rendez_vous_commentaire?: string;
  assigned_by?: number;
  assigned_by_name?: string;
  date_assignation?: string;
  date_import: string;
  pdl: string;
  pce: string;
  date_modification: string;
}

export interface ClotureData {
  commentaire: string;
  tag: string;
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