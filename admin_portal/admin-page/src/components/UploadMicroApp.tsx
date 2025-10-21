/**
 * UploadMicroApp Component
 *
 * Provides a comprehensive interface for uploading micro-application packages
 * to the SuperApp ecosystem. Handles file upload, validation, and form submission
 * with proper authentication and error handling.
 */

import React, { useRef, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { getEndpoint } from "../constants/api";
import { validateZipFile } from "../utils/zip";

export type UploadMicroAppProps = {
  onUploaded?: () => void;
};

// validation helpers moved to ../utils/zip

const UploadMicroApp: React.FC<UploadMicroAppProps> = ({ onUploaded }) => {
  // Authentication context for secure API calls
  // Narrow the SDK context to the minimal shape we use here
  const auth = useAuthContext();

  // Form field state management
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [appId, setAppId] = useState("");
  const [iconUrlPath, setIconUrlPath] = useState("");
  const [description, setDescription] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);

  // UI interaction state
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmFile, setConfirmFile] = useState<File | null>(null);

  // Reference to hidden file input element
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Utility functions for file management
  const getPendingFile = (): File | null => zipFile || confirmFile; // Get current file selection
  const hasPending = !!getPendingFile(); // Check if file is selected

  const validate = async (): Promise<boolean> => {
    if (
      !name.trim() ||
      !version.trim() ||
      !appId.trim() ||
      !description.trim()
    ) {
      setIsError(false);
      setIsWarning(true);
      setMessage("Please provide name, version, appId, and description.");
      setShowModal(true);
      return false;
    }
    const file = getPendingFile();
    const result = await validateZipFile(file);
    if (!result.ok) {
      setIsError(false);
      setIsWarning(true);
      setMessage(result.message ?? "Invalid ZIP file.");
      setShowModal(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (): Promise<void> => {
    setIsWarning(false);
    if (!(await validate())) return;

    const file = getPendingFile();
    if (!file) return; // should be guarded by validate

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
      const headers: Record<string, string> = {};
      try {
        if (auth?.state?.isAuthenticated) {
          const accessToken = await auth
            .getAccessToken?.()
            .catch(() => undefined);
          if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
            headers["x-jwt-assertion"] = accessToken; // make same as Bearer
          }
        }
      } catch (e) {
        // Non-fatal: continue without tokens (backend may reject)
        console.warn("Auth acquisition failed for micro-app upload", e);
      }

      const uploadUrl = getEndpoint("MICROAPPS_UPLOAD");
      console.log("[UploadMicroApp] Upload endpoint =>", uploadUrl);
      // Optionally suppress x-jwt-assertion if remote gateway rejects it
      if (
        process.env.REACT_APP_MICROAPPS_SUPPRESS_ASSERTION === "true" &&
        headers["x-jwt-assertion"]
      ) {
        delete headers["x-jwt-assertion"];
      }
      if (!headers["x-jwt-assertion"]) {
        console.warn(
          "UploadMicroApp: x-jwt-assertion header is missing before request (user likely not authenticated)",
        );
      }

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers, // let browser set multipart boundary
        body: form,
      });

      const ct = res.headers.get("Content-Type") || "";
      type UploadResponse = { message?: string; error?: string; [k: string]: unknown } | null;
      let payload: UploadResponse = null;
      if (ct.includes("application/json")) {
        payload = (await res.json().catch(() => null)) as UploadResponse;
      } else {
        const text = await res.text().catch(() => null);
        if (text) payload = { message: text };
      }

      if (!res.ok) {
        const msg =
          (payload && payload.error) ||
          (payload && payload.message) ||
          `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      setIsError(false);
      setIsWarning(false);
  setMessage((payload && payload.message) || "Micro-app uploaded successfully");
      setShowModal(true);
      // Optional: clear form
      setZipFile(null);
      setConfirmFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Notify parent to refresh list / close view
      try {
        onUploaded && onUploaded();
      } catch (_) {
        /* no-op */
      }
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

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;
    if (file) setConfirmFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = (e.dataTransfer?.files?.[0] as File) ?? null;
    if (file) setConfirmFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragging) setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const confirmSelection = async (): Promise<void> => {
    if (!confirmFile) return;
    setZipFile(confirmFile);
    setConfirmFile(null);
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8, color: "#003a67" }}>
        Upload Micro-App (ZIP)
      </h2>
      <p style={{ marginTop: 0, color: "var(--muted)", marginBottom: 16 }}>
        Fill details and upload a .zip for the micro-app store.
      </p>

      <div
        className="card"
        style={{
          marginBottom: 16,
          background: "#e6f4ff",
          border: "1px solid #bae0ff",
          color: "#003a67",
        }}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Name*</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Payslip Viewer"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--border)",
                color: "#000",
              }}
            />
            {!name.trim() && (
              <small style={{ color: "#dc2626" }}>Required</small>
            )}
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>
              Version*
            </span>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.0.0"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--border)",
                color: "#000",
              }}
            />
            {!version.trim() && (
              <small style={{ color: "#dc2626" }}>Required</small>
            )}
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>App ID*</span>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="e.g., payslip-viewer"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--border)",
                color: "#000",
              }}
            />
            {!appId.trim() && (
              <small style={{ color: "#dc2626" }}>Required</small>
            )}
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>
              Icon URL Path
            </span>
            <input
              type="text"
              value={iconUrlPath}
              onChange={(e) => setIconUrlPath(e.target.value)}
              placeholder="optional"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--border)",
                color: "#000",
              }}
            />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>
              Description*{" "}
              <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                (short summary)
              </span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what the micro-app does"
              rows={3}
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--border)",
                resize: "vertical",
                color: "#000",
              }}
            />
            {!description.trim() && (
              <small style={{ color: "#dc2626" }}>Required</small>
            )}
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
        <p className="dropzone__hint">
          Drag & drop the .zip file here or Choose from the computer
        </p>
        {hasPending && (
          <div className="dropzone__filename" style={{ color: "#666" }}>
            Selected: {getPendingFile()!.name}
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <label
            className="btn btn--primary"
            style={{
              cursor: loading || hasPending ? "not-allowed" : "pointer",
              opacity: loading || hasPending ? 0.65 : 1,
              border: "none",
              outline: "none",
              boxShadow: "none",
            }}
          >
            Choose ZIP
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip,application/x-zip-compressed"
              onChange={onInputChange}
              style={{ display: "none" }}
              disabled={loading || hasPending}
            />
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          className="btn btn--primary"
          style={{ border: "none", outline: "none", boxShadow: "none" }}
          onClick={() => {
            setName("");
            setVersion("");
            setAppId("");
            setIconUrlPath("");
            setDescription("");
            setZipFile(null);
            setConfirmFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        >
          Clear
        </button>
        <button
          className="btn btn--primary"
          style={{ border: "none", outline: "none", boxShadow: "none" }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {confirmFile && (
        <div className="modal-backdrop" onClick={() => setConfirmFile(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#e6f4ff",
              border: "1px solid #bae0ff",
              color: "#003a67",
            }}
          >
            <div
              className="modal__header"
              style={{
                background: "transparent",
                borderBottom: "1px solid #bae0ff",
                color: "#003a67",
              }}
            >
              Confirm File
            </div>
            <div className="modal__body" style={{ background: "transparent" }}>
              <p style={{ margin: 0, color: "#003a67" }}>
                Use <b>{confirmFile.name}</b> as the ZIP file?
              </p>
            </div>
            <div
              className="modal__footer"
              style={{
                borderTop: "1px solid #bae0ff",
                background: "transparent",
              }}
            >
              <button
                className="btn btn--primary"
                style={{ border: "none", outline: "none", boxShadow: "none" }}
                onClick={confirmSelection}
              >
                Yes
              </button>
              <button
                className="btn btn--primary"
                style={{ border: "none", outline: "none", boxShadow: "none" }}
                onClick={() => setConfirmFile(null)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: !isError && !isWarning ? "#e6f4ff" : "var(--surface)",
              border:
                !isError && !isWarning
                  ? "1px solid #bae0ff"
                  : "1px solid var(--border)",
              color: !isError && !isWarning ? "#003a67" : "var(--text)",
            }}
          >
            <div
              className="modal__header"
              style={{
                background: "transparent",
                borderBottom:
                  !isError && !isWarning
                    ? "1px solid #bae0ff"
                    : "1px solid var(--border)",
                color: !isError && !isWarning ? "#003a67" : "var(--text)",
              }}
            >
              {isWarning
                ? "Warning"
                : isError
                  ? "Upload Failed"
                  : "Upload Successful"}
            </div>
            <div className="modal__body" style={{ background: "transparent" }}>
              <p
                style={{
                  margin: 0,
                  color: !isError && !isWarning ? "#003a67" : "var(--text)",
                }}
              >
                {message}
              </p>
            </div>
            <div
              className="modal__footer"
              style={{
                borderTop:
                  !isError && !isWarning
                    ? "1px solid #bae0ff"
                    : "1px solid var(--border)",
                background: "transparent",
              }}
            >
              <button
                className={!isError && !isWarning ? "btn btn--primary" : "btn"}
                style={
                  !isError && !isWarning
                    ? { border: "none", outline: "none", boxShadow: "none" }
                    : undefined
                }
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadMicroApp;
