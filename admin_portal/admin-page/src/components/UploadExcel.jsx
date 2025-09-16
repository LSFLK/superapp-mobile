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
//     const csv = XLSX.utils.sheet_to_csv(worksheet);

//     // Convert CSV string to a Blob for uploading
//     const csvBlob = new Blob([csv], { type: "text/csv" });

//     // Prepare FormData
//     const formData = new FormData();
//     formData.append("file", csvBlob, "converted.csv");

//     try {
//       const response = await fetch("http://localhost:8080/api/v1/payslips/upload", {
//         method: "POST",
//         body: formData,
//       });

//       const result = await response.json();
//       console.log("Upload successful:", result);
//       setMessage(result.message + " | Rows: " + result.count);
//     } catch (error) {
//       console.error("Upload failed:", error);
//       setMessage("Upload failed: " + error.message);
//     }
//   };

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>Upload Excel / CSV for Payslips</h2>
//       <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
//       {message && <p>{message}</p>}
//     </div>
//   );
// }


import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function UploadExcel() {
  const [message, setMessage] = useState("");

  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // If it's already a CSV, pass-through directly
      const isCSV = /\.csv$/i.test(file.name) || file.type.includes("csv");
      let csvText = "";

      if (isCSV) {
        csvText = await file.text();
      } else {
        // Parse Excel with safe options
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, {
          type: "array",
          cellText: false,
          cellDates: true,
          raw: false,
          WTF: false,
        });

        if (!workbook.SheetNames?.length) {
          setMessage("No sheets found in the uploaded file.");
          return;
        }
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          setMessage("First worksheet is empty.");
          return;
        }
        csvText = XLSX.utils.sheet_to_csv(worksheet, { FS: ",", RS: "\n" }) || "";
        if (!csvText.trim()) {
          setMessage("Parsed sheet is empty.");
          return;
        }
      }

      const csvBlob = new Blob([csvText], { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", csvBlob, "converted.csv");

      const response = await fetch("http://localhost:9090/api/v1/payslips/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Upload failed");
      setMessage(`${result.message} | Rows: ${result.count}`);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Upload Excel / CSV</h2>
      <p style={styles.description}>
        Select an Excel or CSV file to upload employee payslips.
      </p>
      <label style={styles.uploadLabel}>
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        Choose File
      </label>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: "500px",
    textAlign: "center",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#2c3e50",
  },
  description: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "20px",
  },
  uploadLabel: {
    display: "inline-block",
    padding: "12px 24px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #3498db, #2980b9)",
    color: "#fff",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
  message: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#27ae60",
  },
};

