// src/utils/exportUtils.js
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Exporte un tableau d'objets en Excel ou CSV
 * @param {Array} data - Les données à exporter (ex: [{firstname: "Jean", lastname: "Martin"}])
 * @param {string} filename - Nom du fichier
 * @param {string} format - "xlsx" ou "csv"
 */
export const exportData = (data, filename = "export", format = "xlsx") => {
  if (!data || data.length === 0) {
    console.warn("Aucune donnée à exporter");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sessions");

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}.csv`);
} else {
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${filename}.xlsx`);
  }
};