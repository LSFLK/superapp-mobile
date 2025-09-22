import React, { useEffect, useState, useCallback } from "react";
import UploadMicroApp from "./UploadMicroApp";
import UploadExcel from "./UploadExcel";
import { useAuthContext } from "@asgardeo/auth-react";

const DEFAULT_MICROAPPS_LIST_URL = "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0/micro-apps";

export default function MicroAppManagement() {
  const auth = useAuthContext();
  const [showUpload, setShowUpload] = useState(false); // micro app zip upload panel
  const [showPayslipUpload, setShowPayslipUpload] = useState(false); // payslip excel upload panel
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

  const openPayslipUpload = () => setShowPayslipUpload(true);
  const closePayslipUpload = () => setShowPayslipUpload(false);
  const closeZipUpload = () => setShowUpload(false);

  const onCardKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPayslipUpload();
    }
  };

  // Combined view with conditional panels stacked vertically
  // Dedicated payslip upload view (hides everything else)
  if (showPayslipUpload) {
    return (
      <div style={{ color: '#fff' }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button className="btn" onClick={closePayslipUpload}>Close</button>
          </div>
          <UploadExcel />
        </div>
      </div>
    );
  }

  // Dedicated micro-app ZIP upload view (no header/cards shown)
  if (showUpload) {
    return (
      <div style={{ color: '#fff' }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button className="btn" onClick={() => setShowUpload(false)}>Close</button>
          </div>
          <UploadMicroApp onUploaded={() => { fetchMicroApps(); setShowUpload(false); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: "#fff" }}>
      {/* Header / actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: "#fff" }}>Available Micro Apps</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={fetchMicroApps} disabled={loadingList} style={{ minWidth: 96 }}>
            {loadingList ? "Refreshing…" : "Refresh"}
          </button>
          <button className="btn btn--primary" onClick={() => setShowUpload(s => !s)}>
            {showUpload ? "Close Upload" : "Add new"}
          </button>
        </div>
      </div>

      {listError && (
        <div className="card" style={{ background: "#2d1f1f", border: "1px solid #5a2f2f", color: "#fca5a5", padding: 12, marginBottom: 16 }}>
          {listError}
        </div>
      )}

      {showUpload && (
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <UploadMicroApp onUploaded={() => { fetchMicroApps(); setShowUpload(false); }} />
        </div>
      )}

      {/* Micro-apps grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {loadingList && microApps.length === 0 && (
          <div className="card" style={{ padding: 16, background: "#111" }}>Loading micro-apps…</div>
        )}
        {!loadingList && microApps.length === 0 && !listError && (
          <div className="card" style={{ padding: 16, background: "#111" }}>No micro-apps found.</div>
        )}
        {microApps.map(app => {
          const isPayslip = app.app_id === 'payslip-viewer';
          const handleClick = () => { if (isPayslip) openPayslipUpload(); };
          return (
            <div
              key={app.micro_app_id || app.app_id}
              className="card"
              role={isPayslip ? 'button' : undefined}
              tabIndex={isPayslip ? 0 : undefined}
              onClick={handleClick}
              onKeyDown={(e) => { if (isPayslip && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleClick(); } }}
              style={{ padding: 16, background: '#fafafa', border: '1px solid #f0f0f0', cursor: isPayslip ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: 8 }}
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
              {isPayslip && (
                <div style={{ fontSize: 11, color: '#1677ff', marginTop: 4 }}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
