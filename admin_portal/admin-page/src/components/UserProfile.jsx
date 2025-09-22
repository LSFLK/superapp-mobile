import React, { useEffect, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";

// Fetches richer user details from Asgardeo and displays them with fallbacks
export default function UserProfile({ state }) {
  const ctx = useAuthContext();
  const [basicInfo, setBasicInfo] = useState(null);
  const [loading, setLoading] = useState(true); // Asgardeo basic info
  const [error, setError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false); // backend profile
  const [profileError, setProfileError] = useState("");
  const [profile, setProfile] = useState(null);

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

  // Fetch backend profile using email once we have it
  useEffect(() => {
    const email = basicInfo?.email || state?.email || basicInfo?.username || state?.username;
    if (!email) return; // wait for email
    const base = "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0";
    if (!base || base.trim() === "") {
      setProfileError("User service base URL not configured (set REACT_APP_USERS_BASE_URL)");
      return;
    }
    let abort = false;
    (async () => {
      setProfileLoading(true);
      setProfileError("");
      try {
        // Construct endpoint; allow override via env var
  // Expecting GET /users/{email}
  const encoded = encodeURIComponent(email);
  const endpoint = `${base}/users/${encoded}`.replace(/([^:]?)\/\//g, '$1/');

        const headers = {};
        try {
          if (ctx?.state?.isAuthenticated) {
            const idToken = await ctx.getIDToken().catch(() => undefined);
            if (idToken) headers["x-jwt-assertion"] = idToken;
            const access = await ctx.getAccessToken().catch(() => undefined);
            if (access) headers["Authorization"] = `Bearer ${access}`;
          }
        } catch (_) { /* non-fatal */ }

        const res = await fetch(endpoint, { headers });
        const ct = res.headers.get('content-type') || '';
        let bodyText = '';
        try { bodyText = await res.text(); } catch (_) { bodyText = ''; }
        if (!res.ok) {
          const snippet = bodyText.slice(0, 180).replace(/\s+/g,' ').trim();
          throw new Error(`Profile fetch failed (${res.status}) ${snippet ? '- ' + snippet : ''}`);
        }
        let data;
        if (/json/i.test(ct)) {
          try {
            data = JSON.parse(bodyText || 'null');
          } catch (e) {
            console.warn('[UserProfile] JSON parse error; body starts with:', bodyText.slice(0,120));
            throw new Error('Invalid JSON in profile response');
          }
        } else {
          // Got HTML or other content; log and raise more specific message
          console.warn('[UserProfile] Non-JSON profile response', { endpoint, contentType: ct, preview: bodyText.slice(0,200) });
          throw new Error('Unexpected HTML response – check REACT_APP_USERS_BASE_URL');
        }
        if (!abort) setProfile(data);
      } catch (e) {
        if (!abort) setProfileError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        if (!abort) setProfileLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [basicInfo, state, ctx]);

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
      {profileLoading && (
        <div style={{ color: '#09589c', marginBottom: 12 }}>Loading profile…</div>
      )}
      {profileError && (
        <div style={{ color: '#b91c1c', marginBottom: 12 }}>{profileError}</div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {givenName && <div><b style={{ color: '#003a67' }}>Given name:</b> {givenName}</div>}
        {familyName && <div><b style={{ color: '#003a67' }}>Family name:</b> {familyName}</div>}
        {locale && <div><b style={{ color: '#003a67' }}>Locale:</b> {locale}</div>}
        {updatedAt && <div><b style={{ color: '#003a67' }}>Updated:</b> {String(updatedAt)}</div>}
        {profile?.user_id !== undefined && <div><b style={{ color: '#003a67' }}>User ID:</b> {profile.user_id}</div>}
        {profile?.first_name && <div><b style={{ color: '#003a67' }}>First name:</b> {profile.first_name}</div>}
        {profile?.last_name && <div><b style={{ color: '#003a67' }}>Last name:</b> {profile.last_name}</div>}
        {profile?.employee_id && <div><b style={{ color: '#003a67' }}>Employee ID:</b> {profile.employee_id}</div>}
        {profile?.department && <div><b style={{ color: '#003a67' }}>Department:</b> {profile.department}</div>}
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
