import React, { useState, useRef } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import * as XLSX from "xlsx";

export default function UploadExcel() {
  const auth = useAuthContext();
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

      // Use relative path so CRA dev proxy (setupProxy.js) can avoid CORS locally.
      // Try to include invoker assertion header if available from Asgardeo
      let headers = {};
      try {
        if (auth?.state?.isAuthenticated) {
          // Identity assertion (ID token)
          const idToken = await auth.getIDToken();
          if (idToken) {
            headers["x-jwt-assertion"] = idToken;
          }
          // API authorization (access token)
          const accessToken = await auth.getAccessToken();
          if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
          }
        }
      } catch (e) {
        console.warn("Could not obtain ID token for upload", e);
      }

      // Resolve single authoritative endpoint
      const explicit = "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload";
      const base = "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/microappbackendprodbranch/v1.0/admin-portal"; // should already end with /admin-portal or similar
      const resolvedEndpoint = explicit
        || (base ? `${base.replace(/\/$/, '')}/upload` : '/upload');

      console.log('[UploadExcel] Using upload endpoint:', resolvedEndpoint);

      const response = await fetch(resolvedEndpoint, { method: 'POST', headers, body: formData });
      let rawText = '';
      let parsed = null;
      try {
        rawText = await response.text();
        parsed = rawText ? JSON.parse(rawText) : null;
      } catch (_) {
        parsed = { message: rawText.slice(0, 300) };
      }
      if (!response.ok) {
        throw new Error(parsed?.message || parsed?.error || `Upload failed (${response.status})`);
      }
      setMessage(`${parsed?.message || 'Upload successful'}`);
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
  <h2 style={{ marginTop: 0, marginBottom: 8, color: "#003a67" }}>Upload Excel / CSV</h2>
      <p style={{ marginTop: 0, color: "#09589c", marginBottom: 16 }}>
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
          <div className="dropzone__filename" style={{ color: '#666' }}>{fileName}</div>
        )}
        <div style={{ marginTop: 14 }}>
          <label
            className="btn btn--primary"
            style={{
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
              border: 'none',
              outline: 'none',
              boxShadow: 'none'
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{
            background: '#e6f4ff',
            border: '1px solid #bae0ff',
            color: '#003a67'
          }}>
            <div className="modal__header" style={{ background: 'transparent', borderBottom: '1px solid #bae0ff' }}>Confirm Upload</div>
            <div className="modal__body" style={{ background: 'transparent' }}>
              <p style={{ margin: 0, color: '#003a67' }}>
                Do you want to upload <b>{confirmFile.name}</b>?
              </p>
            </div>
            <div className="modal__footer" style={{ borderTop: '1px solid #bae0ff', background: 'transparent' }}>
              <button
                className="btn btn--primary"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                onClick={async () => {
                  const file = confirmFile;
                  setConfirmFile(null); // close dialog immediately
                  await processFile(file);
                }}
              >Yes</button>
              <button
                className="btn btn--primary"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                onClick={() => setConfirmFile(null)}
              >No</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Success/Error Modal */}
  {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{
            background: !isError && !isWarning ? '#e6f4ff' : 'var(--surface)',
            border: !isError && !isWarning ? '1px solid #bae0ff' : '1px solid var(--border)',
            color: !isError && !isWarning ? '#003a67' : 'var(--text)'
          }}>
            <div className="modal__header" style={{
              background: 'transparent',
              borderBottom: !isError && !isWarning ? '1px solid #bae0ff' : '1px solid var(--border)',
              color: !isError && !isWarning ? '#003a67' : 'var(--text)'
            }}>{isWarning ? "Warning" : isError ? "Upload Failed" : "Upload Successful"}</div>
            <div className="modal__body" style={{ background: 'transparent' }}>
              <p style={{ margin: 0, color: !isError && !isWarning ? '#003a67' : 'var(--text)' }}>{message}</p>
            </div>
            <div className="modal__footer" style={{
              borderTop: !isError && !isWarning ? '1px solid #bae0ff' : '1px solid var(--border)',
              background: 'transparent'
            }}>
              <button
                className={(!isError && !isWarning) ? 'btn btn--primary' : 'btn'}
                style={(!isError && !isWarning) ? { border: 'none', outline: 'none', boxShadow: 'none' } : undefined}
                onClick={() => setShowModal(false)}
              >Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
