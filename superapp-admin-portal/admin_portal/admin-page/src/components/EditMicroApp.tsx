import React, { useState, useRef } from "react";
import { useAuthInfo } from "../hooks/useAuthInfo";
import { MicroAppRole } from "../types/microapp";

export type EditMicroAppProps = {
  appData: any; // Replace 'any' with the correct type if available
  onClose: () => void;
  onSave: (data: any) => void;
  onRolesChange?: (roles: MicroAppRole[]) => void;
};

const EditMicroApp: React.FC<EditMicroAppProps> = ({ appData, onClose, onSave, onRolesChange }) => {
  const auth = useAuthInfo();
  // Debug: log appData to check roles structure
  // eslint-disable-next-line no-console
  console.log('EditMicroApp received appData:', appData);
  // Prefill state with appData
  const [name, setName] = useState(appData.name || "");
  // Prefill version section from appData.versions[0] if available
  const firstVersion = Array.isArray(appData.versions) && appData.versions.length > 0 ? appData.versions[0] : {};
  const [version, setVersion] = useState(firstVersion.version || appData.version || "");
  const [appId] = useState(appData.appId || ""); // Not editable
  const [iconUrlPath, setIconUrlPath] = useState(firstVersion.iconUrl || appData.iconUrl || "");
  const [bannerImageUrl, setBannerImageUrl] = useState(appData.bannerImageUrl || "");
  const [promoText, setPromoText] = useState(appData.promoText || "");
  const [releaseNotes, setReleaseNotes] = useState(firstVersion.releaseNotes || appData.releaseNotes || "");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [build, setBuild] = useState(firstVersion.build || appData.build || 1);
  const [description, setDescription] = useState(appData.description || "");
  const [createdBy, setCreatedBy] = useState(appData.createdBy || "");
  const [updatedBy, setUpdatedBy] = useState(appData.updatedBy || "");
  const [active, setActive] = useState(appData.active || 0);
  const [isMandatory, setIsMandatory] = useState(appData.isMandatory || 0);
  // Support roles as array of objects, array of strings, or comma-separated string
  const initialRoles = (() => {
    if (Array.isArray(appData.roles) && appData.roles.length > 0) {
      if (typeof appData.roles[0] === 'string') {
        return appData.roles.map((r: string) => ({ role: r }));
      } else if (typeof appData.roles[0] === 'object' && appData.roles[0].role) {
        return appData.roles;
      }
    }
    if (typeof appData.roles === 'string') {
      return appData.roles.split(',').map((r: string) => ({ role: r.trim() })).filter((r: any) => r.role);
    }
    if (Array.isArray(appData.role) && appData.role.length > 0) {
      return appData.role.map((r: string) => ({ role: r }));
    }
    if (typeof appData.role === 'string') {
      return appData.role.split(',').map((r: string) => ({ role: r.trim() })).filter((r: any) => r.role);
    }
    return [];
  })();
  const [roles, setRoles] = useState<MicroAppRole[]>(initialRoles);

  // Sync roles with parent if onRolesChange is provided
  const updateRoles = (newRoles: MicroAppRole[]) => {
    setRoles(newRoles);
    if (typeof onRolesChange === 'function') {
      onRolesChange(newRoles);
    }
  };
  const [newRole, setNewRole] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handlers
  const onIconInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;
    setIconFile(file);
  };

  // Version sections state
  const [versions, setVersions] = useState([
    {
      version: version,
      build: build,
      releaseNotes: releaseNotes,
      iconUrl: iconUrlPath,
      downloadUrl: "",
      isNew: false,
    },
  ]);

  // Add a new version section below
  const handleAddVersion = () => {
    setVersions([
      ...versions,
      {
        version: "",
        build: 1,
        releaseNotes: "",
        iconUrl: "",
        downloadUrl: "",
        isNew: true,
      },
    ]);
  };

  // Update a field in a version section
  const handleVersionFieldChange = (idx: number, field: string, value: any) => {
    setVersions(vs => vs.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  // Save a new version (calls backend for the last/new section)
  const handleSaveVersion = async (idx: number) => {
    const v = versions[idx];
    if (!v.version || !v.build || !v.iconUrl) {
      alert("Version, Build, and Icon URL are required.");
      return;
    }
    try {
      const payload = {
        version: v.version,
        build: Number(v.build),
        releaseNotes: v.releaseNotes,
        iconUrl: v.iconUrl,
        downloadUrl: v.downloadUrl,
      };
      // eslint-disable-next-line no-console
      console.log('Add Version payload:', payload);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      try {
        if (auth && auth.isAuthenticated && auth.auth && typeof auth.auth.getAccessToken === "function") {
          const accessToken = await auth.auth.getAccessToken();
          if (accessToken) {
            headers["x-jwt-assertion"] = accessToken;
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Auth acquisition failed for add version", e);
      }
      const res = await fetch(`/proxy/micro-apps/${appId}/versions`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (res.status === 201) {
        alert("Version added successfully!");
        // Mark as not new
        setVersions(vs => vs.map((ver, i) => i === idx ? { ...ver, isNew: false } : ver));
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to add version: " + (err?.message || res.statusText));
      }
    } catch (e) {
      alert("Error adding version: " + (e instanceof Error ? e.message : e));
    }
  };
  const handleAddBuild = () => {
    // Implement build addition logic
    alert("Add Build clicked");
  };

  const handleSave = async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    try {
      if (auth && auth.isAuthenticated) {
        // Support both auth shapes used in this component: auth.auth.getAccessToken or auth.getAccessToken
        const getToken = (auth as any).auth?.getAccessToken ?? (auth as any).getAccessToken;
        if (typeof getToken === "function") {
          const accessToken = await getToken();
          if (accessToken) {
            headers["x-jwt-assertion"] = accessToken;
          }
        }
      }
    } catch (e) {
      // Non-fatal: continue without tokens (backend may reject)
      // eslint-disable-next-line no-console
      console.warn("Auth acquisition failed for save", e);
    }

    // Collect data and call onSave
    onSave({
      headers,
      iconUrl: iconUrlPath,
      bannerImageUrl,
      promoText,
      releaseNotes,
      build,
      description,
      createdBy,
      updatedBy,
      active,
      isMandatory,
      roles,
      name,
      version,
      appId,
    });
  };

  return (
  <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, width: '100%', height: '90vh', boxSizing: 'border-box', overflowY: 'auto' }}>
      <h2>Edit Micro App</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%' }}>
        <div style={{ flex: 1, minWidth: 120, width: '100%' }}>
          <label>Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1, minWidth: 120, width: '100%' }}>
          <label>App ID *</label>
          <input type="text" value={appId} disabled style={{ width: '100%', background: '#eee' }} />
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
        {/* Show available roles as chips or a list */}
        {roles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
            {roles.map((r, idx) => (
              <span key={idx} style={{ background: '#e6f4ff', color: '#003a67', borderRadius: 12, padding: '4px 12px', fontSize: 14, display: 'flex', alignItems: 'center' }}>
                {r.role}
                <button type="button" onClick={() => updateRoles(roles.filter((_, i) => i !== idx))} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#003a67', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <input type="text" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Add role..." style={{ flex: 1 }} />
          <button type="button" onClick={() => {
            if (newRole.trim()) {
              updateRoles([...roles, { role: newRole.trim() }]);
              setNewRole("");
            }
          }}>Add</button>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <label>Created By</label>
        <input type="text" value={createdBy} onChange={e => setCreatedBy(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ marginTop: 16 }}>
        <label>Updated By</label>
        <input type="text" value={updatedBy} onChange={e => setUpdatedBy(e.target.value)} style={{ width: '100%' }} />
      </div>
      {/* Render all version sections */}
      {versions.map((v, idx) => (
        <div key={idx} style={{ background: '#f6fafd', borderRadius: 16, border: '1px solid #e0e7ef', padding: 24, marginTop: 32, width: '100%' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#003a67' }}>Edit Version {idx + 1}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%' }}>
            <div style={{ flex: 1, minWidth: 100, width: '100%' }}>
              <label>Version *</label>
              <input type="text" value={v.version} onChange={e => handleVersionFieldChange(idx, 'version', e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1, minWidth: 80, width: '100%' }}>
              <label>Build *</label>
              <input type="number" min={1} value={v.build} onChange={e => handleVersionFieldChange(idx, 'build', Number(e.target.value))} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 2, minWidth: 120, width: '100%' }}>
              <label>Release Notes</label>
              <input type="text" value={v.releaseNotes} onChange={e => handleVersionFieldChange(idx, 'releaseNotes', e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginTop: 16, width: '100%' }}>
            <label>Icon URL</label>
            <input
              type="text"
              value={v.iconUrl}
              onChange={e => handleVersionFieldChange(idx, 'iconUrl', e.target.value)}
              placeholder="https://example.com/icon.png"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginTop: 16, width: '100%' }}>
            <label>Download URL</label>
            <input
              type="text"
              value={v.downloadUrl}
              onChange={e => handleVersionFieldChange(idx, 'downloadUrl', e.target.value)}
              placeholder="https://example.com/download.zip"
              style={{ width: '100%' }}
            />
          </div>
          {v.isNew && (
            <div style={{ marginTop: 16, width: '100%' }}>
              <button type="button" onClick={() => handleSaveVersion(idx)} style={{ padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4 }}>
                Save Version
              </button>
            </div>
          )}
        </div>
      ))}
      <div style={{ marginTop: 16, width: '100%' }}>
        <button type="button" onClick={handleAddVersion} style={{ padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4 }}>
          Add Version
        </button>
      </div>
      <div style={{ marginTop: 32, textAlign: 'right', width: '100%' }}>
        <button onClick={handleSave} style={{ padding: '10px 32px', background: '#003a67', color: '#fff', border: 'none', borderRadius: 4, fontSize: 16, marginRight: 16 }}>
          Save
        </button>
        <button onClick={onClose} style={{ padding: '10px 32px', background: '#aaa', color: '#fff', border: 'none', borderRadius: 4, fontSize: 16 }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditMicroApp;
