import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";

export default function UploadExcel() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmFile, setConfirmFile] = useState(null); // new state for confirmation
  const inputRef = useRef(null);

  const processFile = async (file) => {
    setIsError(false);
    setMessage("");
    setLoading(true);
    setFileName(file?.name || "");
    try {
      if (!file) return;
      const isCSV = /.csv$/i.test(file.name) || file.type.includes("csv");
      let csvText = "";

      if (isCSV) {
        csvText = await file.text();
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, {
          type: "array",
          cellText: false,
          cellDates: true,
          raw: false,
          WTF: false,
        });

        if (!workbook.SheetNames?.length) {
          throw new Error("No sheets found in the uploaded file.");
        }
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          throw new Error("First worksheet is empty.");
        }
        csvText =
          XLSX.utils.sheet_to_csv(worksheet, { FS: ",", RS: "\n" }) || "";
        if (!csvText.trim()) {
          throw new Error("Parsed sheet is empty.");
        }
      }

      const csvBlob = new Blob([csvText], { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", csvBlob, "converted.csv");

      const response = await fetch(
        "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/microappbackendprodbranch/v1.0/payslips/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Upload failed");

      setMessage(`${result.message}`);
      setShowModal(true);
      setIsError(false);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setShowModal(true);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setConfirmFile(file); // show custom confirm dialog
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setConfirmFile(file); // show custom confirm dialog
    }
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

  // If a user tries to trigger upload without selecting/confirming a file, show a warning.
  const tryUploadWithoutFile = () => {
    if (!confirmFile && !fileName) {
      setIsWarning(true);
      setIsError(false);
      setMessage("Please choose a file to upload.");
      setShowModal(true);
      return false;
    }
    return true;
  };

  return (
    <div>
  <h2 style={{ marginTop: 0, marginBottom: 8, color: "white" }}>Upload Excel / CSV</h2>
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
  {fileName && !message && !showModal && !confirmFile && (
          <div className="dropzone__filename">{fileName}</div>
        )}
        <div style={{ marginTop: 14 }}>
          <label
            className="btn btn--primary"
            style={{
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Uploading…" : "Choose File"}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={onInputChange}
              style={{ display: "none" }}
              disabled={loading}
            />
          </label>
        </div>
      </div>

      {/* Subtle helper button (hidden in UI) to catch accidental uploads without selection */}
      <div style={{ display: "none" }}>
        <button onClick={tryUploadWithoutFile}>Hidden upload trigger</button>
      </div>

      {/* ✅ Confirmation Modal */}
      {confirmFile && (
        <div className="modal-backdrop" onClick={() => setConfirmFile(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">Confirm Upload</div>
            <div className="modal__body">
              <p style={{ margin: 0 }}>
                Do you want to upload <b>{confirmFile.name}</b>?
              </p>
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--primary"
                onClick={async () => {
                  const file = confirmFile;
                  setConfirmFile(null); // close dialog immediately
                  await processFile(file);
                }}
              >
                Yes
              </button>
              <button className="btn" onClick={() => setConfirmFile(null)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Success/Error Modal */}
  {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
    <div className="modal__header">{isWarning ? "Warning" : isError ? "Upload Failed" : "Upload Successful"}</div>
            <div className="modal__body">
              <p style={{ margin: 0 }}>{message}</p>
            </div>
            <div className="modal__footer">
              <button className="btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
