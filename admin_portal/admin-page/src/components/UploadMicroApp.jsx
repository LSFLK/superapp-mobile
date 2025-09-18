import React, { useRef, useState } from "react";

// Contract
// Inputs: none (uses internal state)
// Output: renders a form to upload micro-app ZIP with fields name, version, appId, iconUrlPath
// Success criteria: POST multipart/form-data to backend and show success/error modal

const BACKEND_BASE_URL = process.env.REACT_APP_MICROAPPS_BASE_URL || "http://localhost:9090";

export default function UploadMicroApp() {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [appId, setAppId] = useState("");
  const [iconUrlPath, setIconUrlPath] = useState("");
  const [zipFile, setZipFile] = useState(null);

  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmFile, setConfirmFile] = useState(null);

  const fileInputRef = useRef(null);

  const validate = () => {
    if (!name.trim() || !version.trim() || !appId.trim()) {
      setIsError(true);
      setMessage("Please provide name, version, and appId.");
      setShowModal(true);
      return false;
    }
    if (!zipFile) {
      setIsError(true);
      setMessage("Please choose a ZIP file.");
      setShowModal(true);
      return false;
    }
    if (zipFile && !/\.zip$/i.test(zipFile.name)) {
      setIsError(true);
      setMessage("Selected file must be a .zip archive.");
      setShowModal(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setIsError(false);
    setMessage("");
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("version", version.trim());
      form.append("appId", appId.trim());
      if (iconUrlPath.trim()) form.append("iconUrlPath", iconUrlPath.trim());
      form.append("zipFile", zipFile);

      const res = await fetch(`${BACKEND_BASE_URL}/micro-apps/upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      setIsError(false);
      setMessage(data?.message || "Micro-app uploaded successfully");
      setShowModal(true);
      // Optional: clear form
      setZipFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Upload failed");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setConfirmFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setConfirmFile(file);
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

  const confirmSelection = async () => {
    if (!confirmFile) return;
    setZipFile(confirmFile);
    setConfirmFile(null);
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Upload Micro-App (ZIP)</h2>
      <p style={{ marginTop: 0, color: "var(--muted)", marginBottom: 16 }}>
        Fill details and upload a .zip for the micro-app store.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Name*</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Payslip Viewer"
              style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
            />
            {!name.trim() && <small style={{ color: "#dc2626" }}>Required</small>}
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Version*</span>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.0.0"
              style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
            />
            {!version.trim() && <small style={{ color: "#dc2626" }}>Required</small>}
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>App ID*</span>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="e.g., payslip-viewer"
              style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
            />
            {!appId.trim() && <small style={{ color: "#dc2626" }}>Required</small>}
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Icon URL Path</span>
            <input
              type="text"
              value={iconUrlPath}
              onChange={(e) => setIconUrlPath(e.target.value)}
              placeholder="optional"
              style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
            />
          </label>
        </div>
      </div>

      <div
        className={`dropzone ${dragging ? "is-dragging" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{ marginBottom: 12 }}
      >
        <p className="dropzone__hint">Drag & drop the .zip file here</p>
        {zipFile && (
          <div className="dropzone__filename">Selected: {zipFile.name}</div>
        )}
        <div style={{ marginTop: 14 }}>
          <label
            className="btn btn--primary"
            style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1 }}
          >
            {loading ? "Uploading…" : "Choose ZIP"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={onInputChange}
              style={{ display: "none" }}
              disabled={loading}
            />
          </label>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !version.trim() || !appId.trim() || !zipFile}
          >
            {loading ? "Uploading…" : "Upload ZIP"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn" onClick={() => {
          setName("");
          setVersion("");
          setAppId("");
          setIconUrlPath("");
          setZipFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}>Clear</button>
  <button className="btn btn--primary" onClick={handleSubmit} disabled={loading || !name.trim() || !version.trim() || !appId.trim() || !zipFile}>
          {loading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {confirmFile && (
        <div className="modal-backdrop" onClick={() => setConfirmFile(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">Confirm File</div>
            <div className="modal__body">
              <p style={{ margin: 0 }}>
                Use <b>{confirmFile.name}</b> as the ZIP file?
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--primary" onClick={confirmSelection}>Yes</button>
              <button className="btn" onClick={() => setConfirmFile(null)}>No</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">{isError ? "Upload Failed" : "Upload Successful"}</div>
            <div className="modal__body">
              <p style={{ margin: 0 }}>{message}</p>
            </div>
            <div className="modal__footer">
              <button className="btn" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
