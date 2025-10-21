/**
 * UserProfile Component
 *
 * Displays comprehensive user profile information by combining data from Asgardeo
 * and the backend user service. Preserves behavior and messages used in tests.
 */

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import Loading from "./common/Loading";
import Card from "./common/Card";
import { COLORS } from "../constants/styles";
import { getEndpoint } from "../constants/api";

type ExternalAuthState = {
  email?: string;
  username?: string;
  given_name?: string;
  family_name?: string;
};

type UserProfileProps = {
  state?: ExternalAuthState;
};

export default function UserProfile({ state }: UserProfileProps) {
  const ctx = useAuthContext();

  // State management for user data from different sources
  type BasicInfo = Record<string, any> | null;
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  type ProfileData = {
    first_name?: string;
    last_name?: string;
    employee_id?: string | number;
    department?: string;
    [k: string]: any;
  } | null;
  const [profile, setProfile] = useState<ProfileData>(null);

  // Effect: Fetch Basic User Info from Asgardeo
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (ctx?.getBasicUserInfo) {
          const info = await ctx.getBasicUserInfo();
          if (mounted) setBasicInfo(info ?? null);
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

  // Effect: Fetch Extended Profile from Backend Service
  useEffect(() => {
  // Guarded extraction from possibly-null basicInfo
  const basicObj = basicInfo && typeof basicInfo === "object" ? (basicInfo as Record<string, any>) : null;
    const email =
      basicObj?.email || state?.email || basicObj?.username || state?.username;
    const emailStr = typeof email === "string" ? email : String(email || "");
    if (!emailStr) return;

    const base =
      getEndpoint("USERS_BASE") ||
      getEndpoint("MICROAPPS_LIST").replace("/micro-apps", "");
    if (!base || base.trim() === "") {
      setProfileError("User service base URL not configured");
      return;
    }

    let abort = false;
    (async () => {
      setProfileLoading(true);
      setProfileError("");
      try {
        const encoded = encodeURIComponent(emailStr);
        const endpoint = `${base}/users/${encoded}`.replace(
          /([^:])\/\//g,
          "$1/",
        );

        const headers: Record<string, string> = {};
        try {
          if (ctx?.state?.isAuthenticated) {
            const isLocalHost =
              typeof window !== "undefined" &&
              /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
            const includeAssertion =
              process.env.REACT_APP_INCLUDE_X_JWT_ASSERTION === "true" ||
              isLocalHost;

            const idToken = await ctx.getIDToken?.().catch(() => undefined);
            if (idToken && includeAssertion)
              headers["x-jwt-assertion"] = idToken;
            const access = await ctx.getAccessToken?.().catch(() => undefined);
            if (access) headers["Authorization"] = `Bearer ${access}`;
          }
        } catch {
          // Non-fatal: continue without tokens
        }

        const res = await fetch(endpoint, { headers });
        const contentType = res.headers.get("content-type") || "";

        let bodyText = "";
        try {
          bodyText = await res.text();
        } catch {
          bodyText = "";
        }

        if (!res.ok) {
          const snippet = bodyText.slice(0, 180).replace(/\s+/g, " ").trim();
          throw new Error(
            `Profile fetch failed (${res.status}) ${snippet ? "- " + snippet : ""}`,
          );
        }

    let data: ProfileData | null = null;
        if (/json/i.test(contentType)) {
          try {
      data = JSON.parse(bodyText || "null");
          } catch (e) {
            console.warn(
              "[UserProfile] JSON parse error; body starts with:",
              bodyText.slice(0, 120),
            );
            throw new Error("Invalid JSON in profile response");
          }
        } else {
          console.warn("[UserProfile] Non-JSON profile response", {
            endpoint,
            contentType,
            preview: bodyText.slice(0, 200),
          });
          throw new Error(
            "Unexpected HTML response – check REACT_APP_USERS_BASE_URL",
          );
        }

        if (!abort) setProfile(data);
      } catch (e) {
        if (!abort) {
          const errorMessage =
            e instanceof Error ? e.message : "Failed to load profile";
          setProfileError(errorMessage);
          console.error("Profile fetch error:", e);
        }
      } finally {
        if (!abort) setProfileLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [basicInfo, state, ctx]);

  const basic = basicInfo && typeof basicInfo === "object" ? (basicInfo as Record<string, any>) : null;
  const givenName =
    (typeof basic?.given_name === "string" && basic?.given_name) ||
    state?.given_name ||
    "";
  const familyName =
    (typeof basic?.family_name === "string" && basic?.family_name) ||
    state?.family_name ||
    "";
  const locale = (typeof basic?.locale === "string" && basic?.locale) || "";
  const updatedAt =
    (typeof basic?.updated_at === "string" && basic?.updated_at) || "";
  const picture = (typeof basic?.picture === "string" && basic?.picture) || "";

  const prof = profile && typeof profile === "object" ? (profile as Record<string, any>) : null;
  const firstName =
    typeof prof?.first_name === "string" ? prof.first_name : null;
  const lastName = typeof prof?.last_name === "string" ? prof.last_name : null;
  const employeeId =
    prof?.employee_id != null ? String(prof.employee_id) : null;
  const department =
    typeof prof?.department === "string" ? prof.department : null;

  return (
    <Card
      style={{
        background: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: 14,
      }}
    >
      <Card
        style={{
          background: COLORS.background,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 4px 12px -2px rgba(0,58,103,0.08)",
          color: COLORS.primary,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12, color: COLORS.primary }}>
          User Profile
        </h2>

        {loading && <Loading message="Loading user details…" />}
        {error && (
          <div style={{ color: COLORS.error, marginBottom: 12 }}>{error}</div>
        )}
        {profileLoading && <Loading message="Loading profile…" />}
        {profileError && (
          <div style={{ color: COLORS.error, marginBottom: 12 }}>
            {profileError}
          </div>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          {givenName && (
            <div>
              <b style={{ color: COLORS.primary }}>Given name:</b> {givenName}
            </div>
          )}
          {familyName && (
            <div>
              <b style={{ color: COLORS.primary }}>Family name:</b> {familyName}
            </div>
          )}
          {locale && (
            <div>
              <b style={{ color: COLORS.primary }}>Locale:</b> {locale}
            </div>
          )}
          {updatedAt && (
            <div>
              <b style={{ color: COLORS.primary }}>Updated:</b>{" "}
              {String(updatedAt)}
            </div>
          )}

          {firstName && (
            <div>
              <b style={{ color: COLORS.primary }}>First name:</b> {firstName}
            </div>
          )}
          {lastName && (
            <div>
              <b style={{ color: COLORS.primary }}>Last name:</b> {lastName}
            </div>
          )}
          {employeeId && (
            <div>
              <b style={{ color: COLORS.primary }}>Employee ID:</b> {employeeId}
            </div>
          )}
          {department && (
            <div>
              <b style={{ color: COLORS.primary }}>Department:</b> {department}
            </div>
          )}
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
      </Card>
    </Card>
  );
}
