// src/shared/columnsConfig.js

const columnOptions = [
    { key: "id", label: "N° Fiche" },
    { key: "date_import", label: "Date d’import" },
    // { key: "imported_by", label: "Importé par (ID)" },
    { key: "imported_by_name", label: "Importé par" },
    { key: "univers", label: "Univers" },
    { key: "nom_client", label: "Nom du client" },
    { key: "prenom_client", label: "Prénom du client" },
    { key: "adresse_client", label: "Adresse" },
    { key: "code_postal", label: "Code postal" },
    { key: "mail_client", label: "Email" },
    { key: "numero_mobile", label: "Téléphone" },
    { key: "statut", label: "Statut" },
    //   { key: "assigned_to", label: "Agent assigné (ID)" },
    { key: "assigned_to_name", label: "Assigné à" },
    //   { key: "assigned_by", label: "Assigné par (ID)" },
    { key: "assigned_by_name", label: "Assigné par" },
    { key: "date_assignation", label: "Date d’assignation" },
    //   { key: "date_creation", label: "Date de création" },
    { key: "commentaire", label: "Commentaire clôture" },
    { key: "tag", label: "Tag clôture" },
    { key: "rendez_vous_date", label: "Date du RDV" },
    { key: "rendez_vous_commentaire", label: "Commentaire du RDV" },
    { key: "date_modification", label: "Dernière modification" },
    // { key: "date_cloture", label: "Date de clôture" },
];

module.exports = columnOptions;