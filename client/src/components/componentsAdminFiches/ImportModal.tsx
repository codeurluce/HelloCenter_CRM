import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';
import Papa from 'papaparse';
import { Fiche } from './fiche';
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onImport: (fiches: Partial<Fiche>[]) => void;
  onImport: (fiches: any[]) => Promise<void>;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredColumns = [
    'nom_client',
    'adresse_client',
    'numero_mobile',
    'prenom_client', 
    'ville_client',
    'numero_fixe',
    'mail_client',
    'code_postal',
    'univers',
  ];

  const sampleData = [
    {
      nom_client: 'Dupont',
      prenom_client: 'Jean',
      numero_mobile: '0623456789',
      numero_fixe: '3347258369',
      mail_client: 'jean.dupont@email.com',
      adresse_client: '123 Rue de la Paix',
      ville_client: 'Paris',
      code_postal: '75001',
      univers: 'Assurance Auto',
      // commentaire: 'Client intéressé par une nouvelle police'
    },
    {
      nom_client: 'Martin',
      prenom_client: 'Marie',
      numero_mobile: '0987654321',
      numero_fixe: '3347258390',
      mail_client: 'marie.martin@email.com',
      adresse_client: '456 Avenue des Champs',
      ville_client: 'Lyon',
      code_postal: '69001',
      univers: 'Assurance Habitation',
      // commentaire: 'Demande de devis pour appartement'
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(fileType || '')) {
      setErrors(['Format de fichier non supporté. Utilisez CSV, XLS ou XLSX.']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    
    if (fileType === 'csv') {
      parseCSV(selectedFile);
    } else {
      parseExcel(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    setIsProcessing(true);
    
    Papa.parse(file, {
      complete: (results) => {
        setIsProcessing(false);
        
        if (results.errors.length > 0) {
          setErrors(results.errors.map(err => err.message));
          return;
        }

        const data = results.data as any[];
        if (data.length === 0) {
          setErrors(['Le fichier est vide.']);
          return;
        }

        const headers = Object.keys(data[0] || {});
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          setErrors([`Colonnes manquantes: ${missingColumns.join(', ')}`]);
          return;
        }

        setPreview(data.slice(0, 500));
        setErrors([]);
      },
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8'
    });
  };

  const parseExcel = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          setErrors(['Le fichier est vide.']);
          setIsProcessing(false);
          return;
        }

        const headers = Object.keys(jsonData[0]);
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          setErrors([`Colonnes manquantes: ${missingColumns.join(', ')}`]);
          setIsProcessing(false);
          return;
        }

        setPreview(jsonData.slice(0, 500));
        setErrors([]);
      } catch (err) {
        setErrors(['Erreur lors de la lecture du fichier Excel.']);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setErrors(['Erreur lors de la lecture du fichier Excel.']);
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

const handleImport = () => {
  if (!file) return;

  setIsProcessing(true);

  const fileType = file.name.split('.').pop()?.toLowerCase();
  const parseAndSend = (validFiches: any[]) => {
    onImport(validFiches)
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Import réussi",
          text: `${validFiches.length} fiche(s) importée(s) avec succès ✅`,
          confirmButtonColor: "#2563eb"
        });
        handleClose();
      })
      .catch((err: any) => {
        Swal.fire({
          icon: "error",
          title: "Erreur d'import",
          text: err?.response?.data?.error || "Une erreur est survenue lors de l’import.",
          confirmButtonColor: "#dc2626"
        });
      })
      .finally(() => setIsProcessing(false));
  };

  if (fileType === "csv") {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as any[];
        const validFiches = data
          .filter(row => row.nom_client && row.prenom_client)
          .map(row => ({
            ...row,
            statut: "nouvelle",
            date_creation: new Date().toISOString(),
          }));
        parseAndSend(validFiches);
      },
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
    });
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array", codepage: 65001 });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      const validFiches = jsonData
        .filter(row => row.nom_client && row.prenom_client)
        .map(row => ({
          ...row,
          statut: "nouvelle",
          date_creation: new Date().toISOString(),
        }));
      parseAndSend(validFiches);
    };
    reader.readAsArrayBuffer(file);
  }
};

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setDragActive(false);
    setIsProcessing(false);
    onClose();
  };

  const downloadSample = () => {
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele_fiches.csv';
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importer des fiches</h2>
            <p className="text-gray-600 mt-1">Importez vos fiches clients depuis un fichier CSV ou Excel</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Zone de téléchargement */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">1. Sélectionnez votre fichier</h3>
              <button
                onClick={downloadSample}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download size={16} />
                Télécharger le modèle
              </button>
            </div>
            
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <FileSpreadsheet size={32} className="text-blue-600" />
                </div>
                
                {file ? (
                  <div>
                    <p className="text-lg font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Glissez votre fichier ici ou cliquez pour sélectionner
                    </p>
                    <p className="text-sm text-gray-500">
                      Formats supportés: CSV, XLS, XLSX
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Erreurs détectées</h4>
                  <ul className="mt-2 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Prévisualisation */}
          {preview.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">2. Prévisualisation</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle size={16} />
                  <span className="font-medium">
                    {preview.length} lignes détectées
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map(key => (
                        <th key={key} className="text-left py-3 px-4 font-semibold text-gray-700 border-b">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        {Object.values(row).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="py-2 px-4 text-gray-900">
                            {value || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Colonnes requises */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Colonnes requises</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
              {requiredColumns.map(col => (
                <div key={col} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>{col}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={!file || errors.length > 0 || preview.length === 0 || isProcessing}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={16} />
            {isProcessing ? 'Traitement...' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;