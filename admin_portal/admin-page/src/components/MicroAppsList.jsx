import React, { useEffect, useState, useCallback } from 'react';
import { fetchMicroApps } from './microAppsService';

export default function MicroAppsList({ refreshToken }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMicroApps();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load micro apps');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  if (loading && !items.length) {
    return <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading micro apps…</div>;
  }
  if (error && !items.length) {
    return (
      <div style={{ color: '#dc2626', fontSize: 14 }}>
        {error} <button className="btn" style={{ padding: '2px 6px', fontSize: 12 }} onClick={load}>Retry</button>
      </div>
    );
  }
  if (!items.length) {
    return <div style={{ color: 'var(--muted)', fontSize: 14 }}>No micro apps found.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
      {items.map(app => {
        const { name, version, description, iconUrlPath, appId } = app;
        return (
          <div key={appId || name} className="card" style={{ padding: 16, background: '#fafafa', border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              {iconUrlPath ? (
                <img src={iconUrlPath} alt={name} width={48} height={48} style={{ borderRadius: 8, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#555' }}>
                  {name?.[0]?.toUpperCase() || '?' }
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, color: '#262626' }}>{name || appId}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{version}</div>
              </div>
            </div>
            <div style={{ color: '#595959', fontSize: 12, lineHeight: 1.4 }}>
              {description || '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
