import React, { useEffect, useState, useCallback } from "react";
import UploadMicroApp from "./UploadMicroApp";
import { useAuthContext } from "@asgardeo/auth-react";

const DEFAULT_MICROAPPS_LIST_URL = "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0/micro-apps";

export default function MicroAppManagement() {
  const auth = useAuthContext();
  const [showUpload, setShowUpload] = useState(false); // micro app zip upload panel
  const [microApps, setMicroApps] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");

  const fetchMicroApps = useCallback(async () => {
    setLoadingList(true);
    setListError("");
    try {
      const headers = {};
      try {
        if (auth?.state?.isAuthenticated) {
          const idToken = await auth.getIDToken().catch(() => undefined);
          if (idToken) headers["x-jwt-assertion"] = idToken;
          const access = await auth.getAccessToken().catch(() => undefined);
          if (access) headers["Authorization"] = `Bearer ${access}`;
        }
      } catch (e) {
        // non-fatal
      }
      const endpoint = (process.env.REACT_APP_MICROAPPS_LIST_URL || DEFAULT_MICROAPPS_LIST_URL).replace(/\/$/, "");
      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error(`Failed to load micro-apps (${res.status})`);
      const data = await res.json();
      if (Array.isArray(data)) setMicroApps(data);
      else if (Array.isArray(data?.items)) setMicroApps(data.items);
      else setMicroApps([]);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Error loading apps");
    } finally {
      setLoadingList(false);
    }
  }, [auth]);

  useEffect(() => { fetchMicroApps(); }, [fetchMicroApps]);

  return (
    <div style={{ color: "#003a67", lineHeight: 1.15 }}>
      {/* Header / actions - only show when not uploading */}
      {!showUpload && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: "#003a67" }}>Available Micro Apps</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn--primary"
              onClick={fetchMicroApps}
              disabled={loadingList}
              style={{
                minWidth: 110,
                border: 'none',
                outline: 'none',
                boxShadow: 'none'
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,144,255,0.35)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {loadingList ? "Refreshing…" : "Refresh"}
            </button>
            <button
              className="btn btn--primary"
              onClick={() => setShowUpload(s => !s)}
              style={{
                border: 'none',
                outline: 'none',
                boxShadow: 'none'
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,144,255,0.35)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {showUpload ? "Close Upload" : "Add new"}
            </button>
          </div>
        </div>
      )}

      {/* Show only Add new button when uploading */}
      {showUpload && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            className="btn btn--primary"
            onClick={() => setShowUpload(false)}
            style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none'
            }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,144,255,0.35)'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            Close
          </button>
        </div>
      )}

      {listError && !showUpload && (
        <div className="card" style={{ background: "#2d1f1f", border: "1px solid #5a2f2f", color: "#fca5a5", padding: 12, marginBottom: 16 }}>
          {listError}
        </div>
      )}

      {showUpload && (
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <UploadMicroApp onUploaded={() => { fetchMicroApps(); setShowUpload(false); }} />
        </div>
      )}

      {/* Micro-apps grid - only show when not uploading */}
      {!showUpload && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {loadingList && microApps.length === 0 && (
            <div
              className="card"
              style={{
                padding: 16,
                background: '#e6f4ff',
                border: '1px solid #bae0ff',
                color: '#003a67',
                fontWeight: 500
              }}
            >
              Loading micro-apps…
            </div>
          )}
          {!loadingList && microApps.length === 0 && !listError && (
            <div className="card" style={{ padding: 16, background: "#111" }}>No micro-apps found.</div>
          )}
          {microApps.map(app => (
            <div
              key={app.micro_app_id || app.app_id}
              className="card"
              style={{ padding: 16, background: '#f5faff', border: '1px solid #e6f4ff', cursor: 'default', display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 14, boxShadow: '0 3px 8px -2px rgba(0,58,103,0.15)' }}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 48, height: 48, background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, borderRadius: 8, color: '#1677ff' }}>
                  {(app.name || app.app_id || '?').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#262626' }}>{app.name || app.app_id}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>v{app.version || '—'}</div>
                </div>
              </div>
              <div style={{ color: '#595959', fontSize: 12, flexGrow: 1 }}>
                {app.description || 'No description'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
