// import React, { useState } from "react";
// import * as XLSX from "xlsx";

// export default function UploadExcel() {
//   const [message, setMessage] = useState("");

//   const handleFileUpload = async (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     // Read Excel file as array buffer
//     const data = await file.arrayBuffer();

//     // Parse Excel file
//     const workbook = XLSX.read(data, { type: "array" });

//     // Convert first sheet to CSV
//     const firstSheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[firstSheetName];
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";

export default function UploadExcel() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const parseToCSV = async (file) => {
    const isCSV = /.csv$/i.test(file.name) || (file.type && file.type.includes("csv"));
    if (isCSV) return file.text();
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, {
      type: "array",
      cellText: false,
      cellDates: true,
      raw: false,
      WTF: false,
    });
    if (!workbook.SheetNames?.length) throw new Error("No sheets found in the uploaded file.");
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) throw new Error("First worksheet is empty.");
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ",", RS: "\n" }) || "";
    if (!csv.trim()) throw new Error("Parsed sheet is empty.");
    return csv;
  };

  const handleUpload = async () => {
    try {
      if (!selectedFile) return;
      setIsError(false);
      setMessage("");
      setLoading(true);

      const csvText = await parseToCSV(selectedFile);
      const csvBlob = new Blob([csvText], { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", csvBlob, "converted.csv");

      const response = await fetch("http://localhost:9090/api/v1/payslips/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Upload failed");
      setMessage(`${result.message}`);
      setIsError(false);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0] || null;
    setMessage("");
    setIsError(false);
    setSelectedFile(file);
    setFileName(file?.name || "");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    setMessage("");
    setIsError(false);
    setSelectedFile(file);
    setFileName(file?.name || "");
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragging) setDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Upload Excel / CSV</h2>
      <p style={{ marginTop: 0, color: "var(--muted)", marginBottom: 16 }}>
        Drag & drop a file here, or choose a file from your computer.
      </p>

      <div
        className={`dropzone ${dragging ? "is-dragging" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <p className="dropzone__hint">.xlsx, .xls, .csv</p>
        {fileName && <div className="dropzone__filename">{fileName}</div>}
        <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "center" }}>
          <label
            className="btn btn--primary"
            style={{
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
          >
            Choose File
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={onInputChange}
              style={{ display: "none" }}
              disabled={loading}
            />
          </label>
          <button
            className="btn btn--primary"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            style={{ cursor: (!selectedFile || loading) ? "not-allowed" : "pointer", opacity: (!selectedFile || loading) ? 0.8 : 1 }}
          >
            {loading ? "Uploading…" : "Upload File"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${isError ? "error" : "success"}`}>{message}</div>
      )}
    </div>
  );
}
 

