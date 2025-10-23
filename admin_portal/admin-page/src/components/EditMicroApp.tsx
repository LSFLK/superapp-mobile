import React, { useState, useRef } from "react";
import { MicroAppRole } from "../types/microapp";

export type EditMicroAppProps = {
  appData: any; // Replace 'any' with the correct type if available
  onClose: () => void;
  onSave: (data: any) => void;
  onRolesChange?: (roles: MicroAppRole[]) => void;
};

const EditMicroApp: React.FC<EditMicroAppProps> = ({ appData, onClose, onSave, onRolesChange }) => {
  // Debug: log appData to check roles structure
  // eslint-disable-next-line no-console
  console.log('EditMicroApp received appData:', appData);
  // Prefill state with appData
  const [name, setName] = useState(appData.name || "");
  const [version, setVersion] = useState(appData.version || "");
  const [appId] = useState(appData.appId || ""); // Not editable
  const [iconUrlPath, setIconUrlPath] = useState(appData.iconUrl || "");
  const [bannerImageUrl, setBannerImageUrl] = useState(appData.bannerImageUrl || "");
  const [promoText, setPromoText] = useState(appData.promoText || "");
  const [releaseNotes, setReleaseNotes] = useState(appData.releaseNotes || "");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [build, setBuild] = useState(appData.build || 1);
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

  // Add Version and Add Build handlers (dummy for now)
  const handleAddVersion = () => {
    // Implement version addition logic
    alert("Add Version clicked");
  };
  const handleAddBuild = () => {
    // Implement build addition logic
    alert("Add Build clicked");
  };

  const handleSave = () => {
    // Collect data and call onSave
    onSave({
      name,
      version,
      appId,
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
      <div style={{ background: '#f6fafd', borderRadius: 16, border: '1px solid #e0e7ef', padding: 24, marginTop: 32, width: '100%' }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, color: '#003a67' }}>Edit Version</h3>
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
          <label>Icon (Upload)</label>
          <input
            type="file"
            accept="image/*"
            onChange={onIconInputChange}
            style={{ display: 'inline-block', marginLeft: 8 }}
          />
          {iconFile && (
            <span style={{ marginLeft: 12 }}>Selected: {iconFile.name}</span>
          )}
        </div>
        <div style={{ marginTop: 16, width: '100%', display: 'flex', gap: 16 }}>
          <button type="button" onClick={handleAddVersion} style={{ padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4 }}>
            Add Version
          </button>
          <button type="button" onClick={handleAddBuild} style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4 }}>
            Add Build
          </button>
        </div>
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
