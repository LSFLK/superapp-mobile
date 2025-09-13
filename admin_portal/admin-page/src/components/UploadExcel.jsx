import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function UploadExcel() {
  const [message, setMessage] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Read Excel file as array buffer
    const data = await file.arrayBuffer();

    // Parse Excel file
    const workbook = XLSX.read(data, { type: "array" });

    // Convert first sheet to CSV
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Convert CSV string to a Blob for uploading
    const csvBlob = new Blob([csv], { type: "text/csv" });

    // Prepare FormData
    const formData = new FormData();
    formData.append("file", csvBlob, "converted.csv");

    try {
      const response = await fetch("http://localhost:8080/api/v1/payslips/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setMessage(result.message + " | Rows: " + result.count);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage("Upload failed: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Excel / CSV for Payslips</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      {message && <p>{message}</p>}
    </div>
  );
}
