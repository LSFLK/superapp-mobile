import React, { useEffect, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";

// Fetches richer user details from Asgardeo and displays them with fallbacks
export default function UserProfile({ state }) {
  const ctx = useAuthContext();
  const [basicInfo, setBasicInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (ctx?.getBasicUserInfo) {
          const info = await ctx.getBasicUserInfo();
          if (mounted) setBasicInfo(info || null);
        }
      } catch (e) {
        console.error("Failed to fetch user info from Asgardeo:", e);
        if (mounted) setError("Could not fetch user details");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ctx]);

  const username = basicInfo?.username || state?.username || "";
  const email = basicInfo?.email || state?.email || username;
  const displayName =
    basicInfo?.name || state?.displayName || state?.given_name || username;
  const givenName = basicInfo?.given_name || state?.given_name || "";
  const familyName = basicInfo?.family_name || state?.family_name || "";
  const locale = basicInfo?.locale || "";
  const updatedAt = basicInfo?.updated_at || "";
  const picture = basicInfo?.picture || "";

  return (
    <div style={{ background: '#f9fcff', border: '1px solid #e3f2ff', borderRadius: 20, padding: 14 }}>
      <div style={{ background: '#f9fcff', border: '1px solid #e3f2ff', borderRadius: 16, padding: 20, boxShadow: '0 4px 12px -2px rgba(0,58,103,0.08)', color: '#003a67' }}>
      <h2 style={{ marginTop: 0, marginBottom: 12, color: '#003a67' }}>User Profile</h2>

      {loading && (
        <div style={{ color: '#09589c', marginBottom: 12 }}>Loading user details…</div>
      )}
      {error && (
        <div style={{ color: "#f87171", marginBottom: 12 }}>{error}</div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        <div><b style={{ color: '#003a67' }}>Name:</b> {displayName}</div>
        <div><b style={{ color: '#003a67' }}>Username:</b> {username}</div>
        <div><b style={{ color: '#003a67' }}>Email:</b> {email}</div>
        {givenName && <div><b style={{ color: '#003a67' }}>Given name:</b> {givenName}</div>}
        {familyName && <div><b style={{ color: '#003a67' }}>Family name:</b> {familyName}</div>}
        {locale && <div><b style={{ color: '#003a67' }}>Locale:</b> {locale}</div>}
        {updatedAt && <div><b style={{ color: '#003a67' }}>Updated:</b> {String(updatedAt)}</div>}
      </div>

      {picture && (
        <div style={{ marginTop: 12 }}>
          <img
            src={picture}
            alt="Profile"
            width={72}
            height={72}
            style={{ borderRadius: 12, border: "1px solid var(--border)" }}
          />
        </div>
      )}
      </div>
    </div>
  );
}
