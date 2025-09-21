import React, { useRef, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";

// Contract
// Inputs: none (uses internal state)
// Output: renders a form to upload micro-app ZIP with fields name, version, appId, iconUrlPath
// Success criteria: POST multipart/form-data to backend and show success/error modal

// Always use the absolute remote micro-app upload endpoint (avoid local proxy as requested).
// Allow override through env var REACT_APP_MICROAPPS_UPLOAD_URL.
const DEFAULT_MICROAPPS_UPLOAD_URL = "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0/micro-apps/upload";
const ENV_MICROAPPS_UPLOAD_URL = process.env.REACT_APP_MICROAPPS_UPLOAD_URL;
const RESOLVED_MICROAPPS_UPLOAD_URL = (ENV_MICROAPPS_UPLOAD_URL || DEFAULT_MICROAPPS_UPLOAD_URL).replace(/\/$/, '');

export default function UploadMicroApp() {
  const auth = useAuthContext();
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [appId, setAppId] = useState("");
  const [iconUrlPath, setIconUrlPath] = useState("");
  const [description, setDescription] = useState("");
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
  form.append("description", description.trim());
      if (iconUrlPath.trim()) form.append("iconUrlPath", iconUrlPath.trim());
      form.append("zipFile", file);

      // Build auth / invoker headers
      const headers = {};
      try {
        if (auth?.state?.isAuthenticated) {
          const idToken = await auth.getIDToken().catch(() => undefined);
          if (idToken) headers["x-jwt-assertion"] = idToken;
          const accessToken = await auth.getAccessToken().catch(() => undefined);
          if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
        }
      } catch (e) {
        // Non-fatal: continue without tokens (backend may reject)
        console.warn("Auth acquisition failed for micro-app upload", e);
      }

      // Optional local dev bypass (uncomment if backend using mock tokens)
      // if (process.env.REACT_APP_DEV_BYPASS_AUTH === 'true' && !headers.Authorization) {
      //   headers.Authorization = 'Bearer admin-token';
      // }

  const uploadUrl = RESOLVED_MICROAPPS_UPLOAD_URL; // already full path
  console.log('[UploadMicroApp] Upload endpoint =>', uploadUrl);
      // Optionally suppress x-jwt-assertion if remote gateway rejects it
      if (process.env.REACT_APP_MICROAPPS_SUPPRESS_ASSERTION === 'true' && headers['x-jwt-assertion']) {
        delete headers['x-jwt-assertion'];
      }
      if (!headers["x-jwt-assertion"]) {
        console.warn("UploadMicroApp: x-jwt-assertion header is missing before request (user likely not authenticated)");
      }

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers, // let browser set multipart boundary
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
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Description* <span style={{ fontWeight: 400, color: "var(--muted)" }}>(short summary)</span></span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what the micro-app does"
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
