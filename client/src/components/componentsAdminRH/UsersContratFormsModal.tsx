// src/componentsRH/UsersContratFormsModal.tsx
import React, { useState, useRef } from "react";
import { Loader2, Save, X, FileText } from "lucide-react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { fr } from "date-fns/locale";
import TextField from "@mui/material/TextField";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { createTheme, ThemeProvider } from "@mui/material/styles";


interface UsersContratFormsModalProps {
    agent: any;
    onClose: () => void;
    onUpdated: () => void;
}

const postesList = ["RH", "Conseiller", "Superviseur", "RPA", "IT"];
const typeContratList = ["CDD", "CDI", "Stagiaire", "Alternance", "Intérim"];
const typePieceList = ["CNI", "Passeport"];
const situationList = [
    "Célibataire",
    "Célibataire avec enfants",
    "Marié(e)",
    "Marié(e) avec enfants",
    "Divorcé(e)",
    "Divorcé(e) avec enfants",
];


export default function UsersContratFormsModal({
    agent,
    onClose,
    onUpdated,
}: UsersContratFormsModalProps) {
    const contrat = agent.contrat || {};
    const [errors, setErrors] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const topRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState({
        poste: contrat.poste || "",
        customPoste: "",
        situation_matrimoniale: contrat.situation_matrimoniale || "",
        type_contrat: contrat.type_contrat || "",
        customTypeContrat: "",
        numero_cni_ou_passeport: contrat.numero_cni_ou_passeport || "",
        type_piece: contrat.type_piece || "CNI",
        customTypePiece: "",
        genre_sexe: contrat.genre_sexe || "",
        matricule: contrat.matricule,
        adresse: contrat.adresse || "",
        code_postal: contrat.code_postal || "",
        telephone: contrat.telephone || "",
        mail_perso: contrat.mail_perso || "",
        date_naissance: contrat.date_naissance ? new Date(contrat.date_naissance) : null,
        date_integration: contrat.date_integration ? new Date(contrat.date_integration) : null,
        date_debut_contrat: contrat.date_debut_contrat ? new Date(contrat.date_debut_contrat) : null,
        date_fin_contrat: contrat.date_fin_contrat ? new Date(contrat.date_fin_contrat) : null,
    });

const theme = createTheme({
  components: {
    MuiPickersDay: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#8cb8ffff",
            color: "#fff",
          },
          "&.Mui-selected": {
            backgroundColor: "#2c6aefff",
            color: "#fff",
          },
        },
      },
    },
  },
} as any);

    const handleChange = (field: string, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors: string[] = [];

        if (!form.matricule || form.matricule.trim() === "")
            validationErrors.push("Le matricule est obligatoire.");

        if (form.date_debut_contrat && form.date_fin_contrat) {
            if (form.date_debut_contrat > form.date_fin_contrat) {
                validationErrors.push("La date de début de contrat ne peut pas être après la date de fin.");
            }
        }

        if (form.date_naissance && form.date_naissance > new Date()) {
            validationErrors.push("La date de naissance ne peut pas être dans le futur.");
        }

        if (!form.poste && !form.customPoste) validationErrors.push("Le poste est obligatoire.");
        if (!form.type_contrat && !form.customTypeContrat)
            validationErrors.push("Le type de contrat est obligatoire.");
        if (!form.date_debut_contrat)
            validationErrors.push("La date de début de contrat est obligatoire.");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (form.mail_perso && !emailRegex.test(form.mail_perso))
            validationErrors.push("L'email n'est pas valide.");

        const phoneRegex = /^[0-9+\-()\s]+$/;
        if (form.telephone) {
            if (!phoneRegex.test(form.telephone)) {
                const invalidChars = form.telephone.replace(/[0-9+\-()\s]/g, '');
                validationErrors.push(
                    `Le numéro contient des caractères non autorisés : "${invalidChars}". ` +
                    `Utilisez uniquement des chiffres, espaces, parenthèses, tirets ou le signe +.`
                );
            }
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            topRef.current?.scrollIntoView({ behavior: "smooth" });
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...form,
                poste: form.customPoste || form.poste,
                type_contrat: form.customTypeContrat || form.type_contrat,
                type_piece: form.customTypePiece || form.type_piece,
            };
            await axiosInstance.put(`/rh/${agent.id}/update-contrat`, payload);
            toast.success("Contrat mis à jour avec succès !");
            onUpdated();
            onClose();
        } catch (err: any) {
            console.error(err);
            setErrors([err.response?.data?.error || "Erreur lors de la mise à jour du contrat"]);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-blue-600 text-white flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <FileText size={22} />
                        <h3 className="text-lg font-bold">
                            Modifier le contrat de {agent.firstname} {agent.lastname}
                        </h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <ThemeProvider theme={theme}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                        <div ref={topRef}></div>
                        {errors.length > 0 && (
                            <div className="bg-red-50 border border-red-400 text-red-700 p-3 rounded-lg">
                                <ul className="list-disc list-inside">
                                    {errors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                            {/* Matricule */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Matricule <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.matricule}
                                    onChange={(e) => handleChange("matricule", e.target.value)}
                                />
                            </div>

                            {/* Mail Perso */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email personnel
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.mail_perso}
                                    onChange={(e) => handleChange("mail_perso", e.target.value)}
                                />
                            </div>

                            {/* Poste */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Poste <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.poste}
                                    onChange={(e) => handleChange("poste", e.target.value)}
                                >
                                    <option value="">-- Choisir un poste --</option>
                                    {postesList.map((p) => (
                                        <option key={p}>{p}</option>
                                    ))}
                                    <option value="Autre">Autre</option>
                                </select>
                                {form.poste === "Autre" && (
                                    <input
                                        placeholder="Préciser le poste..."
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 animate-fadeIn"
                                        value={form.customPoste}
                                        onChange={(e) => handleChange("customPoste", e.target.value)}
                                    />
                                )}
                            </div>

                            {/* Type de contrat */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type de contrat <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.type_contrat}
                                    onChange={(e) => handleChange("type_contrat", e.target.value)}
                                >
                                    <option value="">-- Choisir --</option>
                                    {typeContratList.map((t) => (
                                        <option key={t}>{t}</option>
                                    ))}
                                    <option value="Autre">Autre</option>
                                </select>
                                {form.type_contrat === "Autre" && (
                                    <input
                                        placeholder="Préciser le type de contrat..."
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 animate-fadeIn"
                                        value={form.customTypeContrat}
                                        onChange={(e) => handleChange("customTypeContrat", e.target.value)}
                                    />
                                )}
                            </div>

                            {/* Date debut et fin de contrat */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Début contrat <span className="text-red-500">*</span></label>
                                <DatePicker
                                    label=""
                                    value={form.date_debut_contrat}
                                    onChange={(newValue) => handleChange("date_debut_contrat", newValue)}
                                    format="dd/MM/yyyy"
                                    slotProps={{
                                        popper: { container: document.body },
                                        field: { clearable: true },
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                        },
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fin contrat </label>
                                <DatePicker
                                    label=""
                                    value={form.date_fin_contrat}
                                    onChange={(newValue) => handleChange("date_fin_contrat", newValue)}
                                    format="dd/MM/yyyy"
                                    slotProps={{
                                        popper: { container: document.body },
                                        field: { clearable: true },
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                        },
                                    }}
                                />
                            </div>

                            {/* Situation matrimoniale */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Situation matrimoniale
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.situation_matrimoniale}
                                    onChange={(e) => handleChange("situation_matrimoniale", e.target.value)}
                                >
                                    <option value="">-- Choisir --</option>
                                    {situationList.map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sexe */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sexe <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.genre_sexe || ""}
                                    onChange={(e) => handleChange("genre_sexe", e.target.value)}
                                >
                                    <option value="">-- Choisir --</option>
                                    <option value="Masculin">Masculin</option>
                                    <option value="Féminin">Féminin</option>
                                </select>
                            </div>

                            {/* Type de pièce */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de pièce</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.type_piece}
                                    onChange={(e) => handleChange("type_piece", e.target.value)}
                                >
                                    {typePieceList.map((t) => (
                                        <option key={t}>{t}</option>
                                    ))}
                                    <option value="Autre">Autre</option>
                                </select>
                                {form.type_piece === "Autre" && (
                                    <input
                                        placeholder="Préciser le type de pièce..."
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 animate-fadeIn"
                                        value={form.customTypePiece}
                                        onChange={(e) => handleChange("customTypePiece", e.target.value)}
                                    />
                                )}
                            </div>

                            {/* Numéro pièce */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Numéro CNI / Passeport
                                </label>
                                <input
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.numero_cni_ou_passeport}
                                    onChange={(e) => handleChange("numero_cni_ou_passeport", e.target.value)}
                                />
                            </div>

                            {/* Adresse et Code postal */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                <input
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.adresse}
                                    onChange={(e) => handleChange("adresse", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                                <input
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.code_postal}
                                    onChange={(e) => handleChange("code_postal", e.target.value)}
                                />
                            </div>

                            {/* Numero de telephone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={form.telephone}
                                    onChange={(e) => handleChange("telephone", e.target.value)}
                                />
                            </div>

                            {/* Date de naissance */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date de naissance
                                </label>
                                <DatePicker
                                    label=""
                                    value={form.date_naissance}
                                    onChange={(newValue) => handleChange("date_naissance", newValue)}
                                    format="dd/MM/yyyy"
                                    slotProps={{
                                        popper: { container: document.body },
                                        field: { clearable: true },
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                        },
                                    }}
                                />
                            </div>

                            {/* Dates intégration */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date d’intégration
                                </label>
                                <DatePicker
                                    label=""
                                    value={form.date_integration}
                                    onChange={(newValue) => handleChange("date_integration", newValue)}
                                    format="dd/MM/yyyy"
                                    slotProps={{
                                        popper: { container: document.body },
                                        field: { clearable: true },
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                        },
                                    }}
                                />
                            </div>

                        </div>
                        {/* Boutons annuler et enregistrer */}
                        <div className="flex items-center justify-end gap-2 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                <Save size={16} />
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </LocalizationProvider>
                </ThemeProvider>
            </div>
        </div>
    );
}
