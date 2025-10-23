/**
 * Admin Portal Main Application Component
 */

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { Box, Container, Paper, Button as MuiButton } from "@mui/material";
import UserProfile from "./components/UserProfile";
import { getEndpoint } from "./constants/api";
import MicroAppManagement from "./components/MicroAppManagement";
import MenuBar from "./components/MenuBar";
// import RoleBasedAccessControl from "./components/RoleBasedAccessControl";
// import GroupDebugger from './components/GroupDebugger';
import { COMMON_STYLES } from "./constants/styles";

// Minimal shape for Asgardeo's state object we use
interface AuthState {
  isAuthenticated?: boolean;
  username?: string;
  displayName?: string;
  given_name?: string;
}

export default function App(): React.ReactElement {
  // Extract authentication context and methods from Asgardeo provider
  const ctx = useAuthContext() as any;
  const state: AuthState | undefined = ctx?.state;
  const signIn: (() => Promise<void>) | undefined = ctx?.signIn;
  const signOut: (() => Promise<void>) | undefined = ctx?.signOut;

  // Authentication state derived from Asgardeo context
  const isAuthenticated = Boolean(state?.isAuthenticated);

  // Extract user information from authentication state with fallbacks
  const username = state?.username || "";
  const emailLocalPart = username.includes("@") ? username.split("@")[0] : "";
  const firstName = (
    state?.displayName ||
    emailLocalPart ||
    state?.given_name ||
    username ||
    ""
  ).split(" ")[0];


  // Navigation state for switching between admin sections
  const [activeKey, setActiveKey] = useState<"microapp" | "profile">("microapp");

  // User profile state
  const [profile, setProfile] = useState<null | {
    workEmail: string;
    firstName: string;
    lastName: string;
    userThumbnail: string;
    location: string;
  }>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Fetch user profile from backend
  useEffect(() => {
    if (!isAuthenticated || !state?.username) return;
    setProfileLoading(true);
    setProfileError("");
    const fetchProfile = async () => {
      try {
  const base = getEndpoint("USERS_BASE") || "/api/users";
  const email = state.username || "";
  const endpoint = `${String(base)}/${encodeURIComponent(String(email))}`;
        const headers: Record<string, string> = {};
        if (ctx?.getAccessToken) {
          const access = await ctx.getAccessToken();
          if (access) headers["Authorization"] = `Bearer ${access}`;
          if (access) headers["x-jwt-assertion"] = access;
        }
        const res = await fetch(endpoint, { headers });
        if (!res.ok) throw new Error("Failed to fetch user profile");
        const data = await res.json();
        setProfile({
          workEmail: data.workEmail || data.email || email,
          firstName: data.firstName || data.given_name || data.givenName || "",
          lastName: data.lastName || data.family_name || data.familyName || "",
          userThumbnail: data.userThumbnail || data.picture || "",
          location: data.location || "",
        });
      } catch (e: any) {
        setProfileError(e.message || "Failed to load profile");
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated, state?.username, ctx]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated:", username);
      (async () => {
        try {
          const token = await ctx?.getAccessToken?.();
          if (token) {
            console.log("==== ADMIN PORTAL ACCESS TOKEN (Asgardeo) ====");
            console.log(ctx.getAccessToken());
            console.log("================================================");
          } else {
            console.warn("Access token not available yet.");
          }
        } catch (e) {
          console.error("Failed to retrieve access token", e);
        }
      })();
    }
  }, [isAuthenticated, username, ctx]);

  // Navigation handler for switching between admin sections
  const onNavigate = (key: "microapp" | "profile") => setActiveKey(key);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }} data-testid="layout">
      {isAuthenticated ? (
        <>
          <MenuBar
            onNavigate={(k) => onNavigate(k as "microapp" | "profile")}
            isAuthed={isAuthenticated}
            onSignOut={() => void signOut?.()}
            activeKey={activeKey}
            placement="left"
          />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Container data-testid="content" sx={{ p: 0 }}>
              <div className="greeting" style={COMMON_STYLES.greeting}>
                Hi {firstName},
              </div>
              <main style={{ paddingBottom: 24 }}>
                {/* <GroupDebugger /> */}
                {activeKey === "microapp" && (
                  <section style={{ ...COMMON_STYLES.section, marginTop: 0 }}>
                    <MicroAppManagement />
                  </section>
                )}
                {activeKey === "profile" && (
                  <section className="card">
                    {profileLoading ? (
                      <div style={{ padding: 32, textAlign: "center" }}>Loading profile…</div>
                    ) : profileError ? (
                      <div style={{ color: "red", padding: 32, textAlign: "center" }}>{profileError}</div>
                    ) : profile ? (
                      <UserProfile
                        workEmail={profile.workEmail}
                        firstName={profile.firstName}
                        lastName={profile.lastName}
                        userThumbnail={profile.userThumbnail}
                        location={profile.location}
                      />
                    ) : null}
                  </section>
                )}
              </main>
            </Container>
          </Box>
        </>
      ) : (
        <Box
          data-testid="content"
          sx={{
            p: 2,
            ml: "600px",
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Paper
            elevation={8}
            sx={{
              textAlign: "center",
              bgcolor: "background.paper",
              color: "text.primary",
              border: "1px solid",
              borderColor: "divider",
              maxWidth: 440,
              width: "100%",
              px: 3,
              py: 4,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Please Sign In</h2>
            <p style={{ marginTop: 0 }}>
              You must be logged in to use the admin portal.
            </p>
            <MuiButton variant="contained" onClick={() => void signIn?.()}>
              Sign In
            </MuiButton>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
