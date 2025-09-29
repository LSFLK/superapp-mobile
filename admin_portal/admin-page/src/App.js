/**
 * Admin Portal Main Application Component
 * 
 * This is the root component for the admin portal that handles:
 * - Authentication state management via Asgardeo
 * - Main application routing and navigation
 * - User session management and token handling
 * - Layout structure with sidebar navigation and main content area
 * 
 * Authentication Flow:
 * 1. Check if user is authenticated via Asgardeo context
 * 2. If authenticated, show admin interface with navigation
 * 3. If not authenticated, show sign-in screen
 * 4. Handle token retrieval and logging for debugging
 * 
 * Layout Structure:
 * - Authenticated: Sidebar navigation + main content area
 * - Unauthenticated: Centered sign-in form
 */

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { Layout } from "antd";
import UserProfile from "./components/UserProfile";
import MicroAppManagement from "./components/MicroAppManagement";
import MenuBar from "./components/MenuBar";
import RoleBasedAccessControl from "./components/RoleBasedAccessControl";
import GroupDebugger from "./components/GroupDebugger";
import { COMMON_STYLES, COLORS } from "./constants/styles";

const { Content } = Layout;

function App() {
  // Extract authentication context and methods from Asgardeo provider
  const ctx = useAuthContext();
  const state = ctx?.state;
  const signIn = ctx?.signIn;
  const signOut = ctx?.signOut;

  // Authentication state derived from Asgardeo context
  const isAuthed = Boolean(state?.isAuthenticated);
  
  // Extract user information from authentication state with fallbacks
  const username = state?.username || "";
  const emailLocalPart = username.includes("@") ? username.split("@")[0] : "";
  const firstName = (state?.displayName || emailLocalPart || state?.given_name || username || "").split(" ")[0];

  // Navigation state for switching between admin sections
  const [activeKey, setActiveKey] = useState("microapp");

  /**
   * Effect: Handle authentication state changes and token management
   * 
   * When user becomes authenticated:
   * 1. Log authentication status for debugging
   * 2. Retrieve and log access token for backend API calls
   * 3. Handle token retrieval errors gracefully
   * 
   * The access token is used for authenticating requests to the backend API
   */
  useEffect(() => {
    if (isAuthed) {
      console.log("User is authenticated:", username);
      // Fetch and print the access token once authenticated
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
  }, [isAuthed, username, ctx]);

  // Navigation handler for switching between admin sections
  const onNavigate = (key) => setActiveKey(key);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {isAuthed ? (
        // Authenticated Layout: Sidebar Navigation + Main Content
        <>
          {/* Left sidebar navigation menu */}
          <MenuBar 
            onNavigate={onNavigate} 
            isAuthed={isAuthed} 
            onSignOut={signOut} 
            activeKey={activeKey} 
          />

          {/* Main content area */}
          <Layout>
            {/* Personalized greeting for authenticated user */}
            <div className="greeting" style={COMMON_STYLES.greeting}>
              Hi {firstName},
            </div>
            <Content style={{ padding: "16px" }}>
              <main className="container" style={{ paddingBottom: 48 }}>
                {/* TEMPORARY: Group Debugger - REMOVE IN PRODUCTION */}
                {/* <GroupDebugger /> */}

                {/* Conditional rendering based on active navigation */}
                {activeKey === "microapp" && (
                  <section style={COMMON_STYLES.section}>
                    <MicroAppManagement />
                  </section>
                )}

                {activeKey === "profile" && (
                  <section className="card">
                    <UserProfile state={state} />
                  </section>
                )}
              </main>
            </Content>
          </Layout>
        </>
      ) : (
        /* Unauthenticated Layout: Centered Sign-in Form */
        <Layout>
          <Content style={{ padding: 0, minHeight: '100vh' }}>
            <div
              style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
                background: `linear-gradient(135deg, ${COLORS.background} 0%, #e6f4ff 60%, #d9edff 100%)`
              }}
            >
              {/* Sign-in card with call-to-action */}
              <section
                className="card"
                style={{
                  textAlign: 'center',
                  background: '#e6f4ff',
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.primary,
                  maxWidth: 420,
                  width: '100%',
                  boxShadow: '0 6px 24px -4px rgba(0,58,103,0.15)',
                }}
              >
                <h2 style={{ marginTop: 0, color: COLORS.primary }}>Please Sign In</h2>
                <p style={{ color: COLORS.secondary, marginTop: 0 }}>
                  You must be logged in to use the admin portal.
                </p>
                {/* Sign-in button with Asgardeo authentication */}
                <button
                  className="btn btn--primary"
                  style={COMMON_STYLES.button}
                  onClick={() => signIn && signIn()}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = COMMON_STYLES.buttonFocus.boxShadow;
                  }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Sign In
                </button>
              </section>
            </div>
          </Content>
        </Layout>
      )}
    </Layout>
  );
}

export default App;
