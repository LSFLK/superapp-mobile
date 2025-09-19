import React, { useRef, useState } from "react";

// Contract
// Inputs: none (uses internal state)
// Output: renders a form to upload micro-app ZIP with fields name, version, appId, description (required), iconUrlPath
// Success criteria: POST multipart/form-data to backend and show success/error modal

const BACKEND_BASE_URL = process.env.REACT_APP_MICROAPPS_BASE_URL || "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0";

export default function UploadMicroApp() {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [appId, setAppId] = useState("");
  const [iconUrlPath, setIconUrlPath] = useState("");
  const [description, setDescription] = useState(""); // required
  const [zipFile, setZipFile] = useState(null);

  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmFile, setConfirmFile] = useState(null);

  const fileInputRef = useRef(null);

  const getPendingFile = () => zipFile || confirmFile;
  const hasPending = !!getPendingFile();

  const validate = () => {
    if (!name.trim() || !version.trim() || !appId.trim() || !description.trim()) {
      setIsError(false);
      setIsWarning(true);
      setMessage("Please provide name, version, appId, and description.");
      setShowModal(true);
      return false;
    }
    const file = getPendingFile();
    if (!file) {
      setIsError(false);
      setIsWarning(true);
      setMessage("Please choose a ZIP file.");
      setShowModal(true);
      return false;
    }
    if (file && !/\.zip$/i.test(file.name)) {
      setIsError(false);
      setIsWarning(true);
      setMessage("Selected file must be a .zip archive.");
      setShowModal(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsWarning(false);
    if (!validate()) return;

    const file = getPendingFile();

    setLoading(true);
    setIsError(false);
    setIsWarning(false);
    setMessage("");
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("version", version.trim());
      form.append("appId", appId.trim());
      if (iconUrlPath.trim()) form.append("iconUrlPath", iconUrlPath.trim());
      form.append("description", description.trim());
      form.append("zipFile", file);

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
      setIsWarning(false);
      setMessage(data?.message || "Micro-app uploaded successfully");
      setShowModal(true);
      // Optional: clear form
      setZipFile(null);
      setConfirmFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setIsError(true);
      setIsWarning(false);
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
      <h2 style={{ marginTop: 0, marginBottom: 8, color: "white" }}>Upload Micro-App (ZIP)</h2>
      <p style={{ marginTop: 0, color: "var(--muted)", marginBottom: 16 }}>
        Fill details and upload a .zip for the micro-app store.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Name */}
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
          {/* Version */}
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
          {/* App ID */}
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
          {/* Icon URL Path (optional) */}
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
          {/* Description (required) */}
          <label style={{ gridColumn: "1 / -1", display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Description*</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide a clear description of the micro-app."
              rows={3}
              style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)", resize: "vertical" }}
            />
            {!description.trim() && <small style={{ color: "#dc2626" }}>Required</small>}
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
        <p className="dropzone__hint">Drag & drop the .zip file here or Choose from the computer</p>
        {hasPending && (
          <div className="dropzone__filename">Selected: {getPendingFile().name}</div>
        )}
        <div style={{ marginTop: 14 }}>
          <label
            className="btn btn--primary"
            style={{ cursor: loading || hasPending ? "not-allowed" : "pointer", opacity: loading || hasPending ? 0.65 : 1 }}
          >
            Choose ZIP
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={onInputChange}
              style={{ display: "none" }}
              disabled={loading || hasPending}
            />
          </label>
        </div>
      </div>

      {/* Clear button reset additions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn" onClick={() => {
          setName("");
          setVersion("");
          setAppId("");
          setIconUrlPath("");
          setDescription("");
          setZipFile(null);
          setConfirmFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}>Clear</button>
        <button className="btn btn--primary" onClick={handleSubmit} disabled={loading}>
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
            <div className="modal__header">{isWarning ? "Warning" : isError ? "Upload Failed" : "Upload Successful"}</div>
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
