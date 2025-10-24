
import { useRef, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { MicroAppRole } from "../types/microapp";
import { validateZipFile } from "../utils/zip";
import { getEndpoint } from "../constants/api";

export type UploadMicroAppProps = {
  onUploaded?: () => void;
};



// Remove all code above this line that is not type imports or utility imports

const UploadMicroApp: React.FC<UploadMicroAppProps> = ({ onUploaded }) => {
  // Restore auth context usage
  const auth = useAuthContext();

  // All hooks and logic must be inside this function
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [appId, setAppId] = useState("");
  const [iconUrlPath, setIconUrlPath] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [promoText, setPromoText] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  // Icon file input handler
  const onIconInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;
    setIconFile(file);
  };
  const [build, setBuild] = useState(1);
  const [description, setDescription] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [createdBy, setCreatedBy] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [active, setActive] = useState(0);
  const [isMandatory, setIsMandatory] = useState(0);
  // UI interaction state
  // Roles state
  const [roles, setRoles] = useState<MicroAppRole[]>([]);
  const [newRole, setNewRole] = useState("");
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
    // Validate roles: all must be non-empty
    if (roles.some((r) => !r.role.trim())) {
      setIsError(false);
      setIsWarning(true);
      setMessage("All roles must be non-empty.");
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
      // 1. Upload ZIP file to get downloadUrl (simulate or use your own upload logic)
      // For now, we'll use a placeholder URL. In production, you should upload the file and get the URL.
      // TODO: Replace this with actual upload logic if needed.
      const downloadUrl = "https://example.com/downloads/" + encodeURIComponent(file.name);

      // 2. Build the microApp payload as per the new API spec
      const microAppPayload = {
        name: name.trim(),
        description: description.trim(),
        promoText: promoText.trim() || "Initial Release",
        appId: appId.trim(),
        iconUrl: iconUrlPath.trim() || "https://example.com/icon.png",
        bannerImageUrl: bannerImageUrl.trim() || "https://example.com/banner.png",
        isMandatory: isMandatory,
        versions: [
          {
            version: version.trim(),
            build: build,
            releaseNotes: releaseNotes.trim() || "First release",
            iconUrl: iconUrlPath.trim() || "https://example.com/icon.png",
            downloadUrl,
          },
        ],
        roles: roles,
      };

      // 3. Build auth headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      try {
        if (auth?.state?.isAuthenticated) {
          const accessToken = await auth.getAccessToken?.().catch(() => undefined);
          if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
            headers["x-jwt-assertion"] = accessToken;
          }
        }
      } catch (e) {
        console.warn("Auth acquisition failed for micro-app upload", e);
      }

      // Use the new endpoint for create/update micro-apps
      const uploadUrl = getEndpoint("MICROAPPS_UPLOAD"); // This should point to /api/microapps
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

      // 4. POST the JSON payload to the new endpoint
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(microAppPayload),
      });

      const ct = res.headers.get("Content-Type") || "";
      type UploadResponse = {
        message?: string;
        error?: string;
        [k: string]: unknown;
      } | null;
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
      setZipFile(null);
      setConfirmFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      try {
        onUploaded && onUploaded();
      } catch (_) {}
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
  <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, width: '100%' }}>
      {/* Main Form Sections */}
      <div>
  <div style={{ background: '#f6fafd', borderRadius: 16, border: '1px solid #e0e7ef', padding: 24, marginBottom: 32, width: '100%' }}>
          <h2 style={{ marginTop: 0, marginBottom: 16, color: '#003a67' }}>Create/Update a Micro App</h2>
          {/* Main form fields (no form tag) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%' }}>
            <div style={{ flex: 1, minWidth: 120, width: '100%' }}>
              <label>Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1, minWidth: 120, width: '100%' }}>
              <label>App ID *</label>
              <input type="text" value={appId} onChange={e => setAppId(e.target.value)} required style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16, width: '100%' }}>
            <div style={{ flex: 1, minWidth: 120, width: '100%' }}>
              <label>Icon URL</label>
              <input type="text" value={iconUrlPath} onChange={e => setIconUrlPath(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1, minWidth: 120, width: '100%' }}>
              <label>Banner Image URL</label>
              <input type="text" value={bannerImageUrl} onChange={e => setBannerImageUrl(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginTop: 16, width: '100%' }}>
            <label>Promo Text</label>
            <input type="text" value={promoText} onChange={e => setPromoText(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ marginTop: 16, width: '100%' }}>
            <label>Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginTop: 16, width: '100%' }}>
            <label>Active</label>
            <input type="checkbox" checked={!!active} onChange={e => setActive(e.target.checked ? 1 : 0)} style={{ marginLeft: 8 }} />
            <label style={{ marginLeft: 24 }}>Mandatory</label>
            <input type="checkbox" checked={!!isMandatory} onChange={e => setIsMandatory(e.target.checked ? 1 : 0)} style={{ marginLeft: 8 }} />
          </div>
          <div style={{ marginTop: 16, width: '100%' }}>
            <label>Roles</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input type="text" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Add role..." style={{ flex: 1 }} />
              <button type="button" onClick={() => {
                if (newRole.trim()) {
                  setRoles([...roles, { role: newRole.trim() }]);
                  setNewRole("");
                }
              }}>Add</button>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {roles.map((r, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ flex: 1 }}>{r.role}</span>
                  <button type="button" onClick={() => setRoles(roles.filter((_, i) => i !== idx))} style={{ marginLeft: 8 }}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: 16 }}>
            <label>Created By</label>
            <input type="text" value={createdBy} onChange={e => setCreatedBy(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ marginTop: 16 }}>
            <label>Updated By</label>
            <input type="text" value={updatedBy} onChange={e => setUpdatedBy(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
  <div style={{ background: '#f6fafd', borderRadius: 16, border: '1px solid #e0e7ef', padding: 24, marginTop: 32, width: '100%' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#003a67' }}>Create a Version</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%' }}>
            <div style={{ flex: 1, minWidth: 100, width: '100%' }}>
              <label>Version *</label>
              <input type="text" value={version} onChange={e => setVersion(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1, minWidth: 80, width: '100%' }}>
              <label>Build *</label>
              <input type="number" min={1} value={build} onChange={e => setBuild(Number(e.target.value))} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 2, minWidth: 120, width: '100%' }}>
              <label>Release Notes</label>
              <input type="text" value={releaseNotes} onChange={e => setReleaseNotes(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginTop: 16, width: '100%' }}>
            <label>Icon URL</label>
            <input
              type="text"
              value={iconUrlPath}
              onChange={e => setIconUrlPath(e.target.value)}
              placeholder="https://example.com/icon.png"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginTop: 16, width: '100%' }}>
            <label>ZIP File *</label>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              style={{ border: dragging ? '2px dashed #003a67' : '2px dashed #e0e7ef', borderRadius: 8, padding: 24, textAlign: 'center', background: dragging ? '#e6f4ff' : '#fff', marginBottom: 8 }}
            >
              <input
                type="file"
                accept=".zip"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={onInputChange}
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ marginBottom: 8 }}>
                {zipFile ? 'Change ZIP File' : 'Select ZIP File'}
              </button>
              <div style={{ marginTop: 8 }}>
                {zipFile ? (
                  <span>Selected: {zipFile.name}</span>
                ) : (
                  <span style={{ color: '#888' }}>Drag and drop a ZIP file here, or click to select.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Upload button after both sections */}
  <div style={{ marginTop: 32, textAlign: 'right', width: '100%' }}>
        <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 32px', background: '#003a67', color: '#fff', border: 'none', borderRadius: 4, fontSize: 16 }}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {/* Modals outside main form for correct parent structure */}
      {confirmFile && (
        <div className="modal-backdrop" onClick={() => setConfirmFile(null)}>
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ background: "#e6f4ff", border: "1px solid #bae0ff", color: "#003a67" }}
          >
            <div className="modal__header" style={{ background: "transparent", borderBottom: "1px solid #bae0ff", color: "#003a67" }}>
              Confirm File
            </div>
            <div className="modal__body" style={{ background: "transparent" }}>
              <p style={{ margin: 0, color: "#003a67" }}>
                Use <b>{confirmFile ? confirmFile.name : ''}</b> as the ZIP file?
              </p>
            </div>
            <div className="modal__footer" style={{ borderTop: "1px solid #bae0ff", background: "transparent" }}>
              <button className="btn btn--primary" style={{ border: "none", outline: "none", boxShadow: "none" }} onClick={confirmSelection}>
                Yes
              </button>
              <button className="btn btn--primary" style={{ border: "none", outline: "none", boxShadow: "none" }} onClick={() => setConfirmFile(null)}>
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
            onClick={e => e.stopPropagation()}
            style={{ background: !isError && !isWarning ? "#e6f4ff" : "var(--surface)", border: !isError && !isWarning ? "1px solid #bae0ff" : "1px solid var(--border)", color: !isError && !isWarning ? "#003a67" : "var(--text)" }}
          >
            <div className="modal__header" style={{ background: "transparent", borderBottom: !isError && !isWarning ? "1px solid #bae0ff" : "1px solid var(--border)", color: !isError && !isWarning ? "#003a67" : "var(--text)" }}>
              {isWarning ? "Warning" : isError ? "Upload Failed" : "Upload Successful"}
            </div>
            <div className="modal__body" style={{ background: "transparent" }}>
              <p style={{ margin: 0, color: !isError && !isWarning ? "#003a67" : "var(--text)" }}>{message}</p>
            </div>
            <div className="modal__footer" style={{ borderTop: !isError && !isWarning ? "1px solid #bae0ff" : "1px solid var(--border)", background: "transparent" }}>
              <button className={!isError && !isWarning ? "btn btn--primary" : "btn"} style={!isError && !isWarning ? { border: "none", outline: "none", boxShadow: "none" } : undefined} onClick={() => setShowModal(false)}>
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

