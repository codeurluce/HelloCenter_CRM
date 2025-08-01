// type/fiche.ts

export interface Fiche {
  assigned_to: string;
  id: number;
  univers: string;
  nom_client: string;
  prenom_client: string;
  adresse_client?: string;
  code_postal?: string;
  mail_client?: string;
  numero_mobile?: string;
  statut: 'nouvelle' | 'en_traitement' | 'cloturee';
  commentaire?: string;
  agent_id: number;
  date_creation: string;
  date_modification: string;
  date_import?: string;
  tag?: string;
  assignedTo?: string;
  assignedToName?: string;
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