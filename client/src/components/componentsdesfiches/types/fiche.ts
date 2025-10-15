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
  date_creation: string;
  date_modification: string;
  date_import: string;
  tag?: string;
  assignedTo?: string;
  assignedToName?: string;
  rendez_vous_date?: string;
  rendez_vous_commentaire?: string;
  pdl?: string;
  pce?: string;
}

export interface ClotureData {
  commentaire: string;
  tag: string;
}

export const PREDEFINED_TAGS = [
  'Client injoignable',
  'Refus client',
  'Dossier incomplet',
  'Traité avec succès',
  'Report à plus tard',
  'Doublon',
  'Hors périmètre',
  'Autre'
];